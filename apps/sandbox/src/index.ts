import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import process from 'node:process'
import { DEFAULT_HTTP_ERROR_MESSAGES, ERROR_CODES } from '@code-play/contracts'
import { createErrorPlugin } from '@code-play/shared'
import { TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox'
import websocket from '@fastify/websocket'
import Fastify from 'fastify'
import { config } from './config.js'
import { healthResponseSchema } from './routes/health.schema.js'
import { projectRoutes, sessionRoutes, terminalRoutes } from './routes/index.js'

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

  await app.register(websocket)
  await app.register(createErrorPlugin({
    internalErrorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
    internalErrorMessage: DEFAULT_HTTP_ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    routeNotFoundCode: ERROR_CODES.ROUTE_NOT_FOUND,
    routeNotFoundMessage: DEFAULT_HTTP_ERROR_MESSAGES.ROUTE_NOT_FOUND,
  }))
  await app.register(projectRoutes)
  await app.register(sessionRoutes)
  await app.register(terminalRoutes)

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

  try {
    await app.listen({ port: config.port, host: config.host })
    app.log.info(`Sandbox 服务已启动: http://${config.host}:${config.port}`)
  }
  catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

void main()
