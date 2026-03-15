import { Type } from '@code-play/contracts'

export const terminalSessionParamsSchema = Type.Object({
  sessionId: Type.String({ minLength: 1 }),
})
