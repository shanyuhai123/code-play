import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import process from 'node:process'
import { DEFAULT_HTTP_ERROR_MESSAGES, ERROR_CODES } from '@code-play/contracts'
import { createErrorPlugin } from '@code-play/shared'
import { TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox'
import websocket from '@fastify/websocket'
import Fastify from 'fastify'
import { config } from './config.js'
import { prisma } from './lib/prisma.js'
import { connectRedis, disconnectRedis } from './lib/redis.js'
import { corsPlugin } from './plugins/cors.js'
import { healthRoutes, projectRoutes, sandboxRoutes, terminalRoutes } from './routes/index.js'

const app = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
}).withTypeProvider<TypeBoxTypeProvider>()

async function main() {
  app.setValidatorCompiler(TypeBoxValidatorCompiler)

  await app.register(corsPlugin)
  await app.register(websocket)
  await app.register(createErrorPlugin({
    internalErrorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
    internalErrorMessage: DEFAULT_HTTP_ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    routeNotFoundCode: ERROR_CODES.ROUTE_NOT_FOUND,
    routeNotFoundMessage: DEFAULT_HTTP_ERROR_MESSAGES.ROUTE_NOT_FOUND,
  }))
  await connectRedis()

  await app.register(async (api) => {
    await api.register(healthRoutes)
    await api.register(projectRoutes)
    await api.register(sandboxRoutes)
  }, { prefix: '/api' })

  await app.register(terminalRoutes)

  process.on('SIGINT', async () => {
    await disconnectRedis().catch(() => {})
    await prisma.$disconnect().catch(() => {})
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await disconnectRedis().catch(() => {})
    await prisma.$disconnect().catch(() => {})
    process.exit(0)
  })

  try {
    await app.listen({ port: config.port, host: config.host })
    app.log.info(`API 服务已启动: http://${config.host}:${config.port}`)
  }
  catch (err) {
    app.log.error(err)
    await disconnectRedis().catch(() => {})
    await prisma.$disconnect().catch(() => {})
    process.exit(1)
  }
}

void main()
