import { nanoid } from 'nanoid'
import { prisma } from '../lib/prisma.js'
import { flattenFileTree } from './project-files.js'
import { createProject as createSandboxProject } from './sandbox-client.js'

export async function queueProjectCreation(projectId: string, templateId: string, name: string) {
  void createProjectInBackground(projectId, templateId, name)
}

async function createProjectInBackground(projectId: string, templateId: string, name: string) {
  const task = await prisma.projectTask.findFirst({
    where: {
      projectId,
      type: 'create_template',
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (!task) {
    return
  }

  try {
    await prisma.projectTask.update({
      where: { id: task.id },
      data: {
        status: 'running',
        startedAt: new Date(),
        output: null,
        errorMessage: null,
      },
    })

    const result = await createSandboxProject(templateId, name)
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || '模板创建失败')
    }

    const output = result.data.output ?? ''

    const fileEntries = flattenFileTree(result.data.files)

    await prisma.$transaction(async (tx) => {
      await tx.projectFile.deleteMany({
        where: { projectId },
      })

      if (fileEntries.length > 0) {
        await tx.projectFile.createMany({
          data: fileEntries.map(file => ({
            id: nanoid(),
            projectId,
            path: file.path,
            content: file.content,
          })),
        })
      }

      await tx.project.update({
        where: { id: projectId },
        data: {
          status: 'ready',
          errorMessage: null,
        },
      })

      await tx.projectTask.update({
        where: { id: task.id },
        data: {
          status: 'succeeded',
          output,
          finishedAt: new Date(),
          errorMessage: null,
        },
      })
    })
  }
  catch (error) {
    const message = error instanceof Error ? error.message : '项目创建失败'

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: {
          status: 'failed',
          errorMessage: message,
        },
      })

      await tx.projectTask.update({
        where: { id: task.id },
        data: {
          status: 'failed',
          output: null,
          finishedAt: new Date(),
          errorMessage: message,
        },
      })
    })
  }
}
