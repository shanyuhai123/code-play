import type { FastifyInstance } from 'fastify'
import { healthResponseSchema } from './health.schema.js'

export async function healthRoutes(app: FastifyInstance) {
  app.route({
    method: 'GET',
    url: '/health',
    schema: {
      response: {
        200: healthResponseSchema,
      },
    },
    handler: async () => ({
      success: true as const,
      data: { status: 'ok' as const },
    }),
  })
}
