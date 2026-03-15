import { z } from 'zod'
import { TERMINAL_ERROR_CODES } from './errors'

export const terminalProtocolVersionSchema = z.literal('v1')

export const terminalStreamKindSchema = z.enum(['stdout', 'stderr', 'system'])

export const terminalCloseReasonSchema = z.enum([
  'client_disconnect',
  'session_not_found',
  'session_terminated',
  'shell_exited',
  'upstream_disconnect',
  'internal_error',
  'heartbeat_timeout',
])

export const terminalHelloEventSchema = z.object({
  type: z.literal('terminal.hello'),
  payload: z.object({
    protocolVersion: terminalProtocolVersionSchema,
    sessionId: z.string().min(1),
    clientId: z.string().min(1),
    replayAvailable: z.boolean(),
    shellActive: z.boolean(),
  }),
})

export const terminalInputEventSchema = z.object({
  type: z.literal('terminal.input'),
  payload: z.object({
    sessionId: z.string().min(1),
    data: z.string(),
  }),
})

export const terminalResizeEventSchema = z.object({
  type: z.literal('terminal.resize'),
  payload: z.object({
    sessionId: z.string().min(1),
    cols: z.number().int().positive(),
    rows: z.number().int().positive(),
  }),
})

export const terminalWriterClaimEventSchema = z.object({
  type: z.literal('terminal.writer.claim'),
  payload: z.object({
    sessionId: z.string().min(1),
  }),
})

export const terminalWriterReleaseEventSchema = z.object({
  type: z.literal('terminal.writer.release'),
  payload: z.object({
    sessionId: z.string().min(1),
  }),
})

export const terminalOutputEventSchema = z.object({
  type: z.literal('terminal.output'),
  payload: z.object({
    sessionId: z.string().min(1),
    stream: terminalStreamKindSchema,
    data: z.string(),
  }),
})

export const terminalReplayEventSchema = z.object({
  type: z.literal('terminal.replay'),
  payload: z.object({
    sessionId: z.string().min(1),
    data: z.string(),
  }),
})

export const terminalWriterStateEventSchema = z.object({
  type: z.literal('terminal.writer.state'),
  payload: z.object({
    sessionId: z.string().min(1),
    clientId: z.string().min(1),
    writerClientId: z.string().nullable(),
    role: z.enum(['viewer', 'writer']),
  }),
})

export const terminalExitEventSchema = z.object({
  type: z.literal('terminal.exit'),
  payload: z.object({
    sessionId: z.string().min(1),
    code: z.number().int(),
    reason: z.string().min(1),
  }),
})

export const terminalCloseEventSchema = z.object({
  type: z.literal('terminal.close'),
  payload: z.object({
    sessionId: z.string().min(1),
    reason: terminalCloseReasonSchema,
  }),
})

export const terminalPingEventSchema = z.object({
  type: z.literal('sys.ping'),
  payload: z.object({
    ts: z.number().int().nonnegative(),
  }),
})

export const terminalPongEventSchema = z.object({
  type: z.literal('sys.pong'),
  payload: z.object({
    ts: z.number().int().nonnegative(),
  }),
})

export const terminalErrorEventSchema = z.object({
  type: z.literal('sys.error'),
  payload: z.object({
    code: z.nativeEnum(TERMINAL_ERROR_CODES),
    message: z.string().min(1),
    retryable: z.boolean(),
  }),
})

export const terminalClientEventSchema = z.discriminatedUnion('type', [
  terminalInputEventSchema,
  terminalResizeEventSchema,
  terminalWriterClaimEventSchema,
  terminalWriterReleaseEventSchema,
  terminalCloseEventSchema,
  terminalPingEventSchema,
  terminalPongEventSchema,
])

export const terminalServerEventSchema = z.discriminatedUnion('type', [
  terminalHelloEventSchema,
  terminalOutputEventSchema,
  terminalReplayEventSchema,
  terminalWriterStateEventSchema,
  terminalExitEventSchema,
  terminalCloseEventSchema,
  terminalPingEventSchema,
  terminalPongEventSchema,
  terminalErrorEventSchema,
])

export const terminalEventSchema = z.discriminatedUnion('type', [
  terminalHelloEventSchema,
  terminalInputEventSchema,
  terminalResizeEventSchema,
  terminalWriterClaimEventSchema,
  terminalWriterReleaseEventSchema,
  terminalOutputEventSchema,
  terminalReplayEventSchema,
  terminalWriterStateEventSchema,
  terminalExitEventSchema,
  terminalCloseEventSchema,
  terminalPingEventSchema,
  terminalPongEventSchema,
  terminalErrorEventSchema,
])
