import { Type } from '@code-play/contracts'

export const terminalProjectParamsSchema = Type.Object({
  projectId: Type.String({ minLength: 1 }),
})
