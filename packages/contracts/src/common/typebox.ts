import type { TSchema } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'

export { Type }

export const typeboxApiErrorSchema = Type.Object({
  code: Type.String(),
  message: Type.String(),
})

export const errorResponseSchema = Type.Object({
  success: Type.Literal(false),
  error: typeboxApiErrorSchema,
})

export function successResponseSchema<T extends TSchema>(data: T) {
  return Type.Object({
    success: Type.Literal(true),
    data,
  })
}

export function commonErrorResponseSchemas() {
  return {
    400: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema,
    500: errorResponseSchema,
  }
}
