import { successResponseSchema, Type } from '@code-play/contracts'

export const createProjectBodySchema = Type.Object({
  templateId: Type.String({ minLength: 1 }),
  projectName: Type.String({ minLength: 1 }),
})

export const projectFileNodeSchema = Type.Recursive(Self => Type.Object({
  name: Type.String(),
  path: Type.String(),
  type: Type.Union([Type.Literal('file'), Type.Literal('directory')]),
  content: Type.Optional(Type.String()),
  children: Type.Optional(Type.Array(Self)),
}))

export const createProjectResponseSchema = successResponseSchema(Type.Object({
  files: Type.Array(projectFileNodeSchema),
  output: Type.String(),
}))
