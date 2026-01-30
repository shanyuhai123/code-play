import type { FastifyPluginAsync } from 'fastify'
import { projectRoutes } from './projects'
import { authRoutes } from './auth'
import { sandboxRoutes } from './sandbox'

export const routes: FastifyPluginAsync = async (fastify) => {
  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Register route modules
  await fastify.register(projectRoutes, { prefix: '/projects' })
  await fastify.register(authRoutes, { prefix: '/auth' })
  await fastify.register(sandboxRoutes, { prefix: '/sandbox' })
}
