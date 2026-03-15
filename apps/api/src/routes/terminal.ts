import type { FastifyInstance } from 'fastify'
import { handleTerminalBridgeConnection } from '../services/terminal-coordinator.js'
import { terminalProjectParamsSchema } from './terminal.schema.js'

export async function terminalRoutes(app: FastifyInstance) {
  app.route<{
    Params: { projectId: string }
  }>({
    method: 'GET',
    url: '/api/terminal/:projectId',
    schema: {
      params: terminalProjectParamsSchema,
    },
    handler: async (_request, reply) => {
      reply.code(404).send()
    },
    wsHandler: (socket, request) => {
      const projectId = request.params.projectId ?? request.raw.url?.split('/').pop()
      void handleTerminalBridgeConnection(socket, projectId, app.log)
    },
  })
}
