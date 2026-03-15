import type { FastifyPluginAsyncTypebox, Static } from '@fastify/type-provider-typebox'
import { commonErrorResponseSchemas, ERROR_CODES } from '@code-play/contracts'
import { nanoid } from 'nanoid'
import { config } from '../config.js'
import { createContainer, getContainerHostPort, removeContainer, startDevServer, writeProjectFile, writeProjectFiles } from '../services/container.js'
import { destroyTerminalSession } from '../services/terminal-session.js'
import {
  createSessionBodySchema,
  deleteSessionResponseSchema,
  sessionIdParamsSchema,
  sessionRuntimeResponseSchema,
  writeSessionFileBodySchema,
  writeSessionFileResponseSchema,
} from './sessions.schema.js'

interface SandboxRuntime {
  /**
   * 项目 ID
   * @description 当前沙盒运行时所属项目。
   */
  projectId: string
  /**
   * 会话 ID
   * @description 对外暴露的沙盒会话标识。
   */
  sessionId: string
  /**
   * 容器 ID
   * @description 实际承载项目的 Docker 容器标识。
   */
  containerId: string
  /**
   * 预览端口
   * @description 映射到宿主机的预览端口，null 表示未就绪。
   */
  previewPort: number | null
}

const activeSessions = new Map<string, SandboxRuntime>()
const runtimeByProjectId = new Map<string, SandboxRuntime>()

export const sessionRoutes: FastifyPluginAsyncTypebox = async function sessionRoutes(app) {
  app.route<{ Params: Static<typeof sessionIdParamsSchema> }>({
    method: 'GET',
    url: '/sessions/:id',
    schema: {
      params: sessionIdParamsSchema,
      response: {
        200: sessionRuntimeResponseSchema,
        ...commonErrorResponseSchemas(),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const runtime = activeSessions.get(id)
      if (!runtime) {
        return reply.status(404).send({
          success: false as const,
          error: {
            code: ERROR_CODES.SANDBOX_NOT_FOUND,
            message: '沙盒会话不存在',
          },
        })
      }

      return {
        success: true as const,
        data: {
          sessionId: runtime.sessionId,
          containerId: runtime.containerId,
          previewPort: runtime.previewPort,
        },
      }
    },
  })

  app.route<{ Body: Static<typeof createSessionBodySchema> }>({
    method: 'POST',
    url: '/sessions',
    schema: {
      body: createSessionBodySchema,
      response: {
        200: sessionRuntimeResponseSchema,
        ...commonErrorResponseSchemas(),
      },
    },
    handler: async (request) => {
      const body = request.body
      const existing = runtimeByProjectId.get(body.projectId)
      if (existing) {
        return {
          success: true as const,
          data: {
            sessionId: existing.sessionId,
            containerId: existing.containerId,
            previewPort: existing.previewPort,
          },
        }
      }

      const container = await createContainer({ exposePorts: [config.docker.devServerPort] })
      const sessionId = nanoid()

      try {
        await writeProjectFiles(container.id, body.files)

        const previewPort = await getContainerHostPort(container.id, config.docker.devServerPort)
        const runtime: SandboxRuntime = {
          projectId: body.projectId,
          sessionId,
          containerId: container.id,
          previewPort,
        }

        activeSessions.set(sessionId, runtime)
        runtimeByProjectId.set(body.projectId, runtime)

        // fire-and-forget: 后台安装依赖并启动 dev server
        startDevServer(container.id).catch(e => app.log.error(e, 'dev server 启动失败'))

        return {
          success: true as const,
          data: { sessionId, containerId: container.id, previewPort },
        }
      }
      catch (error) {
        await removeContainer(container.id).catch(() => {})
        throw error
      }
    },
  })

  app.route<{ Params: Static<typeof sessionIdParamsSchema>, Body: Static<typeof writeSessionFileBodySchema> }>({
    method: 'PATCH',
    url: '/sessions/:id/files',
    schema: {
      params: sessionIdParamsSchema,
      body: writeSessionFileBodySchema,
      response: {
        200: writeSessionFileResponseSchema,
        ...commonErrorResponseSchemas(),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const body = request.body
      const runtime = activeSessions.get(id)
      if (!runtime) {
        return reply.status(404).send({
          success: false as const,
          error: {
            code: ERROR_CODES.SANDBOX_NOT_FOUND,
            message: '沙盒会话不存在',
          },
        })
      }

      await writeProjectFile(runtime.containerId, body.path, body.content)

      return {
        success: true as const,
        data: { path: body.path },
      }
    },
  })

  app.route<{ Params: Static<typeof sessionIdParamsSchema> }>({
    method: 'DELETE',
    url: '/sessions/:id',
    schema: {
      params: sessionIdParamsSchema,
      response: {
        200: deleteSessionResponseSchema,
        ...commonErrorResponseSchemas(),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const runtime = activeSessions.get(id)
      if (!runtime) {
        return reply.status(404).send({
          success: false as const,
          error: {
            code: ERROR_CODES.SANDBOX_NOT_FOUND,
            message: '沙盒会话不存在',
          },
        })
      }

      await destroyTerminalSession(id)
      await removeContainer(runtime.containerId)
      activeSessions.delete(id)
      runtimeByProjectId.delete(runtime.projectId)

      return { success: true as const, data: {} }
    },
  })
}

export function getSessionContainerId(sessionId: string): string | undefined {
  return activeSessions.get(sessionId)?.containerId
}
