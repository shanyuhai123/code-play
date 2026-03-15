import type { FastifyPluginAsyncTypebox, Static } from '@fastify/type-provider-typebox'
import { createTerminalSession } from '../services/terminal-session.js'
import { getSessionContainerId } from './sessions.js'
import { terminalSessionParamsSchema } from './terminal.schema.js'

export const terminalRoutes: FastifyPluginAsyncTypebox = async function terminalRoutes(app) {
  app.route<{ Params: Static<typeof terminalSessionParamsSchema> }>({
    method: 'GET',
    url: '/terminal/:sessionId',
    schema: {
      params: terminalSessionParamsSchema,
    },
    handler: async (_request, reply) => {
      reply.code(404).send()
    },
    wsHandler: (socket, request) => {
      const { sessionId } = request.params
      const containerId = getSessionContainerId(sessionId)

      if (!containerId) {
        socket.send(JSON.stringify({
          type: 'terminal.close',
          payload: {
            sessionId,
            reason: 'session_not_found',
          },
        }))
        socket.close()
        return
      }

      createTerminalSession(sessionId, containerId, socket)
    },
  })
}
