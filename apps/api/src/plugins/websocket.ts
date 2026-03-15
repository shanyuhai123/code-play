import type { FastifyInstance } from 'fastify'
import websocket from '@fastify/websocket'

export async function websocketPlugin(app: FastifyInstance) {
  await app.register(websocket)
}
