import type { TerminalClientEvent, TerminalCloseReason, TerminalServerEvent } from '@code-play/contracts'
import type { WebSocket } from '@fastify/websocket'
import type { Buffer } from 'node:buffer'
import { terminalClientEventSchema } from '@code-play/contracts'
import { createTerminalErrorPayload } from '@code-play/shared'
import { createExecStream } from './container.js'

const MAX_REPLAY_BYTES = 256 * 1024

interface TerminalRuntime {
  /**
   * 会话 ID
   * @description 当前内存态终端运行时对应的会话标识。
   */
  sessionId: string
  /**
   * 容器 ID
   * @description 当前终端绑定的容器标识。
   */
  containerId: string
  /**
   * 客户端集合
   * @description 已连接到该终端会话的 WebSocket 客户端。
   */
  clients: Set<WebSocket>
  /**
   * 回放缓冲区
   * @description 缓存的历史输出，用于新连接回放。
   */
  replayBuffer: string
  /**
   * Shell 活跃
   * @description 终端 shell 进程是否仍在运行。
   */
  shellActive: boolean
  /**
   * 执行流
   * @description 与容器 shell 绑定的执行流对象。
   */
  execStream: Awaited<ReturnType<typeof createExecStream>>
}

const runtimes = new Map<string, TerminalRuntime>()

function sendEvent(ws: WebSocket, event: TerminalServerEvent) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(event))
  }
}

function appendReplay(runtime: TerminalRuntime, data: string) {
  runtime.replayBuffer += data
  if (runtime.replayBuffer.length > MAX_REPLAY_BYTES) {
    runtime.replayBuffer = runtime.replayBuffer.slice(-MAX_REPLAY_BYTES)
  }
}

function broadcast(runtime: TerminalRuntime, event: TerminalServerEvent) {
  for (const client of runtime.clients) {
    sendEvent(client, event)
  }
}

function detachClient(runtime: TerminalRuntime, ws: WebSocket) {
  runtime.clients.delete(ws)
}

async function closeRuntime(sessionId: string, reason: TerminalCloseReason) {
  const runtime = runtimes.get(sessionId)
  if (!runtime) {
    return
  }

  runtime.shellActive = false
  broadcast(runtime, {
    type: 'terminal.close',
    payload: {
      sessionId,
      reason,
    },
  })

  for (const client of runtime.clients) {
    client.close()
  }

  runtime.clients.clear()
  runtime.execStream.stream.end()
  runtimes.delete(sessionId)
}

async function createRuntime(sessionId: string, containerId: string) {
  const execStream = await createExecStream(containerId, ['/bin/sh', '-i'])

  const runtime: TerminalRuntime = {
    sessionId,
    containerId,
    clients: new Set(),
    replayBuffer: '',
    shellActive: true,
    execStream,
  }

  execStream.stream.on('data', (chunk: Buffer) => {
    const data = chunk.toString()
    appendReplay(runtime, data)
    broadcast(runtime, {
      type: 'terminal.output',
      payload: {
        sessionId,
        stream: 'stdout',
        data,
      },
    })
  })

  execStream.stream.on('end', async () => {
    runtime.shellActive = false

    let exitCode = 0
    try {
      const inspectResult = await execStream.inspect()
      exitCode = inspectResult.ExitCode ?? 0
    }
    catch {
      exitCode = 0
    }

    broadcast(runtime, {
      type: 'terminal.exit',
      payload: {
        sessionId,
        code: exitCode,
        reason: 'shell exited',
      },
    })

    await closeRuntime(sessionId, 'shell_exited')
  })

  execStream.stream.on('error', async () => {
    broadcast(runtime, {
      type: 'sys.error',
      payload: createTerminalErrorPayload('TERMINAL_STREAM_ERROR', false),
    })

    await closeRuntime(sessionId, 'internal_error')
  })

  runtimes.set(sessionId, runtime)
  return runtime
}

async function getOrCreateRuntime(sessionId: string, containerId: string) {
  const existing = runtimes.get(sessionId)
  if (existing) {
    return existing
  }

  return createRuntime(sessionId, containerId)
}

async function handleClientEvent(runtime: TerminalRuntime, ws: WebSocket, event: TerminalClientEvent) {
  switch (event.type) {
    case 'terminal.input': {
      if (event.payload.sessionId !== runtime.sessionId || !runtime.shellActive) {
        return
      }

      runtime.execStream.stream.write(event.payload.data)
      return
    }
    case 'terminal.resize': {
      if (event.payload.sessionId !== runtime.sessionId || !runtime.shellActive) {
        return
      }

      await runtime.execStream.resize(event.payload.cols, event.payload.rows)
      return
    }
    case 'terminal.close': {
      detachClient(runtime, ws)
      ws.close()
      return
    }
    case 'sys.ping': {
      sendEvent(ws, {
        type: 'sys.pong',
        payload: {
          ts: event.payload.ts,
        },
      })
      break
    }
    case 'sys.pong': {
      break
    }
  }
}

export function createTerminalSession(sessionId: string, containerId: string, ws: WebSocket) {
  const setup = async () => {
    const runtime = await getOrCreateRuntime(sessionId, containerId)
    runtime.clients.add(ws)

    sendEvent(ws, {
      type: 'terminal.hello',
      payload: {
        protocolVersion: 'v1',
        sessionId,
        clientId: 'sandbox',
        replayAvailable: runtime.replayBuffer.length > 0,
        shellActive: runtime.shellActive,
      },
    })

    if (runtime.replayBuffer) {
      sendEvent(ws, {
        type: 'terminal.replay',
        payload: {
          sessionId,
          data: runtime.replayBuffer,
        },
      })
    }

    ws.on('message', (raw: Buffer | string) => {
      const text = typeof raw === 'string' ? raw : raw.toString()

      let payload: unknown
      try {
        payload = JSON.parse(text)
      }
      catch {
        sendEvent(ws, {
          type: 'sys.error',
          payload: createTerminalErrorPayload('INVALID_TERMINAL_MESSAGE', false),
        })
        return
      }

      const parsed = terminalClientEventSchema.safeParse(payload)

      if (!parsed.success) {
        sendEvent(ws, {
          type: 'sys.error',
          payload: createTerminalErrorPayload('INVALID_TERMINAL_EVENT', false),
        })
        return
      }

      void handleClientEvent(runtime, ws, parsed.data)
    })

    ws.on('close', () => {
      detachClient(runtime, ws)
    })

    ws.on('error', () => {
      detachClient(runtime, ws)
    })
  }

  setup().catch(() => {
    sendEvent(ws, {
      type: 'sys.error',
      payload: createTerminalErrorPayload('TERMINAL_CONNECT_FAILED', false),
    })
    ws.close()
  })
}

export async function destroyTerminalSession(sessionId: string, reason: TerminalCloseReason = 'session_terminated') {
  await closeRuntime(sessionId, reason)
}
