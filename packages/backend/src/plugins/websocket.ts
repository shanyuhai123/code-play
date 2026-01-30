import type { FastifyPluginAsync } from 'fastify'
import fastifyWebsocket from '@fastify/websocket'

export const websocketPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyWebsocket)
}
