import { successResponseSchema, Type } from '@code-play/contracts'

export const sessionIdParamsSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
})

export const createSessionBodySchema = Type.Object({
  projectId: Type.String({ minLength: 1 }),
  files: Type.Array(Type.Object({
    path: Type.String({ minLength: 1 }),
    content: Type.String(),
  })),
})

export const writeSessionFileBodySchema = Type.Object({
  path: Type.String({ minLength: 1 }),
  content: Type.String(),
})

export const sessionRuntimeDataSchema = Type.Object({
  sessionId: Type.String(),
  containerId: Type.String(),
  previewPort: Type.Union([Type.Number(), Type.Null()]),
})

export const writeSessionFileDataSchema = Type.Object({
  path: Type.String(),
})

export const sessionRuntimeResponseSchema = successResponseSchema(sessionRuntimeDataSchema)

export const writeSessionFileResponseSchema = successResponseSchema(writeSessionFileDataSchema)

export const deleteSessionResponseSchema = successResponseSchema(Type.Object({}))
