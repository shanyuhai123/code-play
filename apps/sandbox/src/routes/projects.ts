import type { FastifyPluginAsyncTypebox, Static } from '@fastify/type-provider-typebox'
import { commonErrorResponseSchemas, ERROR_CODES } from '@code-play/contracts'
import { resolveViteTemplate, TEMPLATE_IDS } from '@code-play/domain'
import { AppError } from '@code-play/shared'
import { config } from '../config.js'
import { createContainer, execInContainer, getContainerArchive, removeContainer } from '../services/container.js'
import { extractFiles } from '../services/file-extractor.js'
import { createProjectBodySchema, createProjectResponseSchema } from './projects.schema.js'

export const projectRoutes: FastifyPluginAsyncTypebox = async function projectRoutes(app) {
  app.route<{ Body: Static<typeof createProjectBodySchema> }>({
    method: 'POST',
    url: '/projects/create',
    schema: {
      body: createProjectBodySchema,
      response: {
        200: createProjectResponseSchema,
        ...commonErrorResponseSchemas(),
      },
    },
    handler: async (request) => {
      const body = request.body

      if (!TEMPLATE_IDS.includes(body.templateId)) {
        throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, `不支持的模板: ${body.templateId}`)
      }

      const viteTemplate = resolveViteTemplate(body.templateId)
      let container: Awaited<ReturnType<typeof createContainer>> | null = null

      try {
        container = await createContainer()
        const { stdout, stderr } = await execInContainer(container.id, [
          'sh',
          '-lc',
          `
            export CI=1
            export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
            pnpm dlx create-vite@7.1.1 project --template ${viteTemplate}
          `,
        ])

        const projectPath = `${config.docker.workDir}/project`
        const archiveStream = await getContainerArchive(container.id, projectPath)
        const files = await extractFiles(archiveStream, 'project')
        const output = `${stdout}${stderr}`.trim()

        return { success: true as const, data: { files, output } }
      }
      catch (error) {
        app.log.error(error, '项目创建失败')
        const message = error instanceof Error ? error.message : '项目创建失败'
        throw new AppError(500, ERROR_CODES.PROJECT_CREATION_FAILED, message)
      }
      finally {
        if (container) {
          removeContainer(container.id).catch(e => app.log.error(e, '清理容器失败'))
        }
      }
    },
  })
}
