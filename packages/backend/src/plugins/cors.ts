import type { FastifyPluginAsync } from 'fastify'
import fastifyCors from '@fastify/cors'
import { config } from '../config/env'

export const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyCors, {
    origin: config.cors.origin,
    credentials: true,
  })
}
