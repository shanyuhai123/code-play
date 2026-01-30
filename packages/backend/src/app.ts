import Fastify from 'fastify'
import { corsPlugin } from './plugins/cors'
import { jwtPlugin } from './plugins/jwt'
import { websocketPlugin } from './plugins/websocket'
import { routes } from './routes'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'error',
    },
  })

  // Register plugins
  await app.register(corsPlugin)
  await app.register(jwtPlugin)
  await app.register(websocketPlugin)

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Register routes
  await app.register(routes, { prefix: '/api' })

  return app
}
