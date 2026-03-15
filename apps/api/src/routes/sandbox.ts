import type { FastifyPluginAsyncTypebox, Static } from '@fastify/type-provider-typebox'
import { commonErrorResponseSchemas, ERROR_CODES } from '@code-play/contracts'
import { AppError } from '@code-play/shared'
import { ensureProjectSandbox, getLiveProjectSandbox, stopProjectSandbox } from '../services/sandbox-runtime.js'
import {
  sandboxProjectParamsSchema,
  sandboxSessionResponseSchema,
  sandboxStartResponseSchema,
  sandboxStopResponseSchema,
} from './sandbox.schema.js'

export const sandboxRoutes: FastifyPluginAsyncTypebox = async function sandboxRoutes(app) {
  app.route<{ Params: Static<typeof sandboxProjectParamsSchema> }>({
    method: 'GET',
    url: '/sandbox/:projectId',
    schema: {
      params: sandboxProjectParamsSchema,
      response: {
        200: sandboxSessionResponseSchema,
        ...commonErrorResponseSchemas(),
      },
    },
    handler: async (request) => {
      const { projectId } = request.params
      const session = await getLiveProjectSandbox(projectId)

      if (!session) {
        throw new AppError(404, ERROR_CODES.SANDBOX_NOT_FOUND)
      }

      return { success: true as const, data: session }
    },
  })

  app.route<{ Params: Static<typeof sandboxProjectParamsSchema> }>({
    method: 'POST',
    url: '/sandbox/:projectId/start',
    schema: {
      params: sandboxProjectParamsSchema,
      response: {
        200: sandboxStartResponseSchema,
        ...commonErrorResponseSchemas(),
      },
    },
    handler: async (request) => {
      const { projectId } = request.params
      try {
        const { session, previewUrl } = await ensureProjectSandbox(projectId)
        return {
          success: true as const,
          data: {
            session,
            previewUrl,
          },
        }
      }
      catch (error) {
        const message = error instanceof Error ? error.message : '沙盒启动失败'
        if (message === ERROR_CODES.PROJECT_NOT_FOUND) {
          throw new AppError(404, ERROR_CODES.PROJECT_NOT_FOUND)
        }

        if (message === ERROR_CODES.PROJECT_NOT_READY) {
          throw new AppError(409, ERROR_CODES.PROJECT_NOT_READY)
        }

        throw new AppError(500, ERROR_CODES.SANDBOX_CREATION_FAILED, message)
      }
    },
  })

  app.route<{ Params: Static<typeof sandboxProjectParamsSchema> }>({
    method: 'DELETE',
    url: '/sandbox/:projectId',
    schema: {
      params: sandboxProjectParamsSchema,
      response: {
        200: sandboxStopResponseSchema,
        ...commonErrorResponseSchemas(),
      },
    },
    handler: async (request) => {
      const { projectId } = request.params
      try {
        const session = await stopProjectSandbox(projectId)
        if (!session) {
          throw new AppError(404, ERROR_CODES.SANDBOX_NOT_FOUND)
        }

        return { success: true as const, data: null }
      }
      catch (error) {
        if (error instanceof AppError) {
          throw error
        }

        const message = error instanceof Error ? error.message : '关闭沙盒失败'
        throw new AppError(500, ERROR_CODES.SANDBOX_EXECUTION_FAILED, message)
      }
    },
  })
}
