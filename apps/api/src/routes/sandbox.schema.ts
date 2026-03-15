import { successResponseSchema, Type } from '@code-play/contracts'

export const sandboxProjectParamsSchema = Type.Object({
  projectId: Type.String({ minLength: 1 }),
})

const isoDateSchema = Type.String({ format: 'date-time' })

export const sandboxSessionSchema = Type.Object({
  id: Type.String(),
  projectId: Type.String(),
  containerId: Type.String(),
  status: Type.String(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
})

export const sandboxSessionResponseSchema = successResponseSchema(sandboxSessionSchema)
export const sandboxStartResponseSchema = successResponseSchema(Type.Object({
  session: sandboxSessionSchema,
  previewUrl: Type.Union([Type.String(), Type.Null()]),
}))
export const sandboxStopResponseSchema = successResponseSchema(Type.Null())
