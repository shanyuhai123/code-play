import type { ProjectSummary } from '@code-play/domain'
import type { FastifyPluginAsyncTypebox, Static } from '@fastify/type-provider-typebox'
import process from 'node:process'
import { commonErrorResponseSchemas, ERROR_CODES } from '@code-play/contracts'
import { AppError } from '@code-play/shared'
import { nanoid } from 'nanoid'
import { prisma } from '../lib/prisma.js'
import { queueProjectCreation } from '../services/project-creator.js'
import { buildFileTree, normalizeFilePath } from '../services/project-files.js'
import { writeSessionFile } from '../services/sandbox-client.js'
import {
  createProjectBodySchema,
  createProjectResponseSchema,
  deleteProjectResponseSchema,
  listProjectsResponseSchema,
  projectDetailResponseSchema,
  projectIdParamsSchema,
  syncProjectFileBodySchema,
  syncProjectFileResponseSchema,
  updateProjectBodySchema,
  updateProjectResponseSchema,
} from './projects.schema.js'

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || null

function toProjectSummary(project: {
  id: string
  name: string
  templateId: string
  status: string
  errorMessage: string | null
  userId: string | null
  createdAt: Date
  updatedAt: Date
  sessions?: Array<{ id: string }>
}): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    templateId: project.templateId,
    status: project.status as ProjectSummary['status'],
    errorMessage: project.errorMessage,
    userId: project.userId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    activeSessionId: project.sessions?.[0]?.id ?? null,
  }
}

export const projectRoutes: FastifyPluginAsyncTypebox = async function projectRoutes(app) {
  app.route<{ Params: Static<typeof projectIdParamsSchema> }>({
    method: 'GET',
    url: '/projects',
    schema: {
      response: {
        200: listProjectsResponseSchema,
        ...commonErrorResponseSchemas(),
      },
    },
    handler: async () => {
      const projects = await prisma.project.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          sessions: {
            where: { status: 'running' },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
        },
      })

      return {
        success: true,
        data: projects.map(toProjectSummary),
      }
    },
  })

  app.route<{ Params: Static<typeof projectIdParamsSchema> }>({
    method: 'GET',
    url: '/projects/:projectId',
    schema: {
      params: projectIdParamsSchema,
      response: {
        200: projectDetailResponseSchema,
        ...commonErrorResponseSchemas(),
      },
    },
    handler: async (request) => {
      const { projectId } = request.params
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          files: {
            orderBy: { path: 'asc' },
          },
          sessions: {
            where: { status: 'running' },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
          tasks: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })

      if (!project) {
        throw new AppError(404, ERROR_CODES.PROJECT_NOT_FOUND)
      }

      return {
        success: true,
        data: {
          project: toProjectSummary(project),
          files: project.status === 'ready'
            ? buildFileTree(project.files.map(file => ({ path: file.path, content: file.content })))
            : [],
          task: project.tasks[0] ?? null,
        },
      }
    },
  })

  app.route<{ Body: Static<typeof createProjectBodySchema> }>({
    method: 'POST',
    url: '/projects',
    schema: {
      body: createProjectBodySchema,
      response: {
        200: createProjectResponseSchema,
        ...commonErrorResponseSchemas(),
      },
    },
    handler: async (request) => {
      const body = request.body
      const projectId = nanoid()

      const project = await prisma.$transaction(async (tx) => {
        const created = await tx.project.create({
          data: {
            id: projectId,
            name: body.name,
            templateId: body.templateId,
            status: 'creating',
            errorMessage: null,
            userId: DEFAULT_USER_ID,
          },
          include: {
            sessions: {
              where: { status: 'running' },
              take: 1,
            },
          },
        })

        await tx.projectTask.create({
          data: {
            id: nanoid(),
            projectId,
            type: 'create_template',
            status: 'pending',
          },
        })

        return created
      })

      await queueProjectCreation(projectId, body.templateId, body.name)

      return {
        success: true,
        data: {
          project: toProjectSummary(project),
        },
      }
    },
  })

  app.route<{ Params: Static<typeof projectIdParamsSchema>, Body: Static<typeof updateProjectBodySchema> }>({
    method: 'PATCH',
    url: '/projects/:projectId',
    schema: {
      params: projectIdParamsSchema,
      body: updateProjectBodySchema,
      response: {
        200: updateProjectResponseSchema,
        ...commonErrorResponseSchemas(),
      },
    },
    handler: async (request) => {
      const { projectId } = request.params
      const body = request.body

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      })

      if (!project) {
        throw new AppError(404, ERROR_CODES.PROJECT_NOT_FOUND)
      }

      const updated = await prisma.project.update({
        where: { id: projectId },
        data: { name: body.name },
      })

      return { success: true as const, data: updated }
    },
  })

  app.route<{ Params: Static<typeof projectIdParamsSchema>, Body: Static<typeof syncProjectFileBodySchema> }>({
    method: 'PATCH',
    url: '/projects/:projectId/files',
    schema: {
      params: projectIdParamsSchema,
      body: syncProjectFileBodySchema,
      response: {
        200: syncProjectFileResponseSchema,
        ...commonErrorResponseSchemas(),
      },
    },
    handler: async (request) => {
      const { projectId } = request.params
      const body = request.body

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          sessions: {
            where: { status: 'running' },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
        },
      })

      if (!project) {
        throw new AppError(404, ERROR_CODES.PROJECT_NOT_FOUND)
      }

      if (project.status !== 'ready') {
        throw new AppError(409, ERROR_CODES.PROJECT_NOT_READY)
      }

      const path = normalizeFilePath(body.path)
      const existing = await prisma.projectFile.findUnique({
        where: {
          projectId_path: {
            projectId,
            path,
          },
        },
      })

      const saved = existing
        ? await prisma.projectFile.update({
            where: {
              projectId_path: {
                projectId,
                path,
              },
            },
            data: {
              content: body.content,
              version: { increment: 1 },
            },
          })
        : await prisma.projectFile.create({
            data: {
              id: nanoid(),
              projectId,
              path,
              content: body.content,
            },
          })

      const activeSession = project.sessions[0]
      if (activeSession) {
        await writeSessionFile(activeSession.id, path, body.content)
          .then(async (result) => {
            if (result.success || result.error?.code !== ERROR_CODES.SANDBOX_NOT_FOUND) {
              return
            }

            await prisma.sandboxSession.update({
              where: { id: activeSession.id },
              data: { status: 'stopped' },
            })
          })
          .catch((error) => {
            app.log.error(error, '同步容器文件失败')
          })
      }

      await prisma.project.update({
        where: { id: projectId },
        data: { updatedAt: new Date() },
      })

      return {
        success: true as const,
        data: {
          file: saved,
        },
      }
    },
  })

  app.route<{ Params: Static<typeof projectIdParamsSchema> }>({
    method: 'DELETE',
    url: '/projects/:projectId',
    schema: {
      params: projectIdParamsSchema,
      response: {
        200: deleteProjectResponseSchema,
        ...commonErrorResponseSchemas(),
      },
    },
    handler: async (request) => {
      const { projectId } = request.params
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      })

      if (!project) {
        throw new AppError(404, ERROR_CODES.PROJECT_NOT_FOUND)
      }

      await prisma.project.delete({
        where: { id: projectId },
      })

      return { success: true as const, data: null }
    },
  })
}
