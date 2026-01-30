import type { FastifyPluginAsync } from 'fastify'
import { projectRoutes } from './projects'
import { sandboxRoutes } from './sandboxes'

export const routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(projectRoutes, { prefix: '/projects' })
  await fastify.register(sandboxRoutes, { prefix: '/sandboxes' })
}
