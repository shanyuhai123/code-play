import { successResponseSchema, Type } from '@code-play/contracts'
import { TEMPLATE_IDS } from '@code-play/domain'

export const projectIdParamsSchema = Type.Object({
  projectId: Type.String({ minLength: 1 }),
})

export const createProjectBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 50 }),
  templateId: Type.Union(TEMPLATE_IDS.map(templateId => Type.Literal(templateId))),
})

export const updateProjectBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 50 }),
})

export const syncProjectFileBodySchema = Type.Object({
  path: Type.String({ minLength: 1 }),
  content: Type.String(),
  version: Type.Optional(Type.Integer({ minimum: 1 })),
})

const isoDateSchema = Type.String({ format: 'date-time' })
const nullableStringSchema = Type.Union([Type.String(), Type.Null()])

export const projectSummarySchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  templateId: Type.String(),
  status: Type.String(),
  errorMessage: nullableStringSchema,
  userId: nullableStringSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  activeSessionId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

export const projectTaskSchema = Type.Object({
  id: Type.String(),
  projectId: Type.String(),
  type: Type.String(),
  status: Type.String(),
  output: nullableStringSchema,
  errorMessage: nullableStringSchema,
  startedAt: Type.Union([isoDateSchema, Type.Null()]),
  finishedAt: Type.Union([isoDateSchema, Type.Null()]),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
})

export const fileNodeSchema = Type.Recursive(Self => Type.Object({
  name: Type.String(),
  path: Type.String(),
  type: Type.Union([Type.Literal('file'), Type.Literal('directory')]),
  content: Type.Optional(Type.String()),
  children: Type.Optional(Type.Array(Self)),
}))

export const updatedProjectSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  templateId: Type.String(),
  status: Type.String(),
  errorMessage: nullableStringSchema,
  userId: nullableStringSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
})

export const projectFileSchema = Type.Object({
  id: Type.String(),
  projectId: Type.String(),
  path: Type.String(),
  content: Type.String(),
  version: Type.Integer(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
})

export const listProjectsResponseSchema = successResponseSchema(Type.Array(projectSummarySchema))

export const projectDetailResponseSchema = successResponseSchema(Type.Object({
  project: projectSummarySchema,
  files: Type.Array(fileNodeSchema),
  task: Type.Union([projectTaskSchema, Type.Null()]),
}))

export const createProjectResponseSchema = successResponseSchema(Type.Object({
  project: projectSummarySchema,
}))

export const updateProjectResponseSchema = successResponseSchema(updatedProjectSchema)

export const syncProjectFileResponseSchema = successResponseSchema(Type.Object({
  file: projectFileSchema,
}))

export const deleteProjectResponseSchema = successResponseSchema(Type.Null())
