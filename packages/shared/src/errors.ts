import { getDefaultHttpErrorMessage } from './http-error'

export class AppError extends Error {
  readonly statusCode: number
  readonly code: string

  constructor(statusCode: number, code: string, message?: string) {
    super(message ?? getDefaultHttpErrorMessage(code) ?? code)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function createErrorPlugin(options?: {
  internalErrorCode?: string
  internalErrorMessage?: string
  routeNotFoundCode?: string
  routeNotFoundMessage?: string
}) {
  const {
    internalErrorCode = 'INTERNAL_SERVER_ERROR',
    internalErrorMessage = '服务器内部错误',
    routeNotFoundCode = 'ROUTE_NOT_FOUND',
    routeNotFoundMessage = '请求的资源不存在',
  } = options ?? {}

  return async function errorPlugin(app: {
    setErrorHandler: (handler: (error: unknown, request: { log: { error: (error: unknown) => void } }, reply: {
      status: (statusCode: number) => { send: (payload: unknown) => unknown }
    }) => unknown) => void
    setNotFoundHandler: (handler: (_request: unknown, reply: {
      status: (statusCode: number) => { send: (payload: unknown) => unknown }
    }) => unknown) => void
  }) {
    app.setErrorHandler((error, request, reply) => {
      if (isAppError(error)) {
        return reply.status(error.statusCode).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        })
      }

      request.log.error(error)
      return reply.status(500).send({
        success: false,
        error: {
          code: internalErrorCode,
          message: internalErrorMessage,
        },
      })
    })

    app.setNotFoundHandler((_request, reply) => {
      return reply.status(404).send({
        success: false,
        error: {
          code: routeNotFoundCode,
          message: routeNotFoundMessage,
        },
      })
    })
  }
}
