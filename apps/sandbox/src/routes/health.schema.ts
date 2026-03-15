import { successResponseSchema, Type } from '@code-play/contracts'

export const healthResponseSchema = successResponseSchema(Type.Object({
  status: Type.Literal('ok'),
}))
