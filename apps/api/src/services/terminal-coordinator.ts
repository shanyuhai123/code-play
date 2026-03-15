import type { TerminalClientEvent, TerminalServerEvent } from '@code-play/contracts'
import type { Buffer } from 'node:buffer'
import { terminalClientEventSchema, terminalServerEventSchema } from '@code-play/contracts'
import { createTerminalErrorPayload } from '@code-play/shared'
import { nanoid } from 'nanoid'
import WebSocket from 'ws'
import { config } from '../config.js'
import { prisma } from '../lib/prisma.js'
import { ensureProjectSandbox, stopProjectSandbox } from './sandbox-runtime.js'
import {
  addProjectClient,
  claimWriter,
  countProjectClients,
  getWriterClientId,
  releaseWriter,
  removeProjectClient,
  renewWriter,
} from './terminal-presence.js'

const MAX_REPLAY_BYTES = 256 * 1024
const IDLE_TIMEOUT_MS = 120_000
const WRITER_RENEW_INTERVAL_MS = 10_000

interface BrowserClient {
  /**
   * 客户端 ID
   * @description 浏览器侧终端客户端唯一标识。
   */
  clientId: string
  /**
   * Socket
   * @description 浏览器与 API 间的 WebSocket 连接。
   */
  socket: WebSocket
}

interface ProjectCoordinator {
  /**
   * 项目 ID
   * @description 当前协调器所属项目。
   */
  projectId: string
  /**
   * 会话 ID
   * @description 当前上游沙盒终端会话标识。
   */
  sessionId: string
  /**
   * 上游连接
   * @description API 与 sandbox 服务之间的 WebSocket 连接。
   */
  upstream: WebSocket
  /**
   * 客户端映射
   * @description 当前项目下所有浏览器客户端。
   */
  clients: Map<string, BrowserClient>
  /**
   * 回放缓冲区
   * @description 缓存的历史输出，用于新客户端回放。
   */
  replayBuffer: string
  /**
   * Shell 活跃
   * @description 上游 shell 进程是否仍在运行。
   */
  shellActive: boolean
  /**
   * 空闲定时器
   * @description 无客户端时触发自动关闭的定时器。
   */
  idleTimer: ReturnType<typeof setTimeout> | null
  /**
   * 写者续约定时器
   * @description 定期续期当前写者锁的定时器。
   */
  writerRenewTimer: ReturnType<typeof setInterval> | null
  /**
   * 就绪 Promise
   * @description 等待上游 terminal.hello 完成握手的 Promise。
   */
  ready: Promise<void>
}

const coordinators = new Map<string, ProjectCoordinator>()

function appendReplay(coordinator: ProjectCoordinator, data: string) {
  coordinator.replayBuffer += data
  if (coordinator.replayBuffer.length > MAX_REPLAY_BYTES) {
    coordinator.replayBuffer = coordinator.replayBuffer.slice(-MAX_REPLAY_BYTES)
  }
}

function sendServerEvent(socket: WebSocket, event: TerminalServerEvent) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(event))
  }
}

function sendClientEvent(socket: WebSocket, event: TerminalClientEvent) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(event))
  }
}

async function broadcastWriterState(coordinator: ProjectCoordinator) {
  const writerClientId = await getWriterClientId(coordinator.projectId)

  for (const client of coordinator.clients.values()) {
    sendServerEvent(client.socket, {
      type: 'terminal.writer.state',
      payload: {
        sessionId: coordinator.sessionId,
        clientId: client.clientId,
        writerClientId,
        role: writerClientId === client.clientId ? 'writer' : 'viewer',
      },
    })
  }
}

function scheduleWriterRenew(coordinator: ProjectCoordinator) {
  if (coordinator.writerRenewTimer) {
    clearInterval(coordinator.writerRenewTimer)
  }

  coordinator.writerRenewTimer = setInterval(async () => {
    const writerClientId = await getWriterClientId(coordinator.projectId)
    if (!writerClientId || !coordinator.clients.has(writerClientId)) {
      return
    }

    await renewWriter(coordinator.projectId, writerClientId)
  }, WRITER_RENEW_INTERVAL_MS)
}

async function stopCoordinator(projectId: string) {
  const coordinator = coordinators.get(projectId)
  if (!coordinator) {
    return
  }

  if (coordinator.idleTimer) {
    clearTimeout(coordinator.idleTimer)
  }

  if (coordinator.writerRenewTimer) {
    clearInterval(coordinator.writerRenewTimer)
  }

  coordinator.upstream.close()
  coordinators.delete(projectId)
}

async function scheduleIdleShutdown(projectId: string) {
  const coordinator = coordinators.get(projectId)
  if (!coordinator) {
    return
  }

  if (coordinator.idleTimer) {
    clearTimeout(coordinator.idleTimer)
  }

  coordinator.idleTimer = setTimeout(async () => {
    const activeCount = await countProjectClients(projectId)
    if (activeCount > 0) {
      return
    }

    await stopProjectSandbox(projectId).catch(() => {})
    await stopCoordinator(projectId)
  }, IDLE_TIMEOUT_MS)
}

async function fetchProjectCreationOutput(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        where: { type: 'create_template' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  return project?.tasks[0]?.output ?? ''
}

async function createCoordinator(projectId: string) {
  const { session } = await ensureProjectSandbox(projectId)
  const upstreamUrl = `${config.sandbox.baseUrl.replace(/^http/, 'ws')}/terminal/${session.id}`
  const upstream = new WebSocket(upstreamUrl)
  const initialOutput = await fetchProjectCreationOutput(projectId)

  const coordinator: ProjectCoordinator = {
    projectId,
    sessionId: session.id,
    upstream,
    clients: new Map(),
    replayBuffer: initialOutput,
    shellActive: true,
    idleTimer: null,
    writerRenewTimer: null,
    ready: Promise.resolve(),
  }

  coordinator.ready = new Promise((resolve, reject) => {
    upstream.on('message', (raw: Buffer | string) => {
      const text = typeof raw === 'string' ? raw : raw.toString()

      let payload: unknown
      try {
        payload = JSON.parse(text)
      }
      catch {
        for (const client of coordinator.clients.values()) {
          sendServerEvent(client.socket, {
            type: 'sys.error',
            payload: createTerminalErrorPayload('INVALID_UPSTREAM_MESSAGE', false),
          })
        }
        return
      }

      const parsed = terminalServerEventSchema.safeParse(payload)
      if (!parsed.success) {
        return
      }

      const event = parsed.data

      switch (event.type) {
        case 'terminal.hello':
          coordinator.shellActive = event.payload.shellActive
          resolve()
          return
        case 'terminal.output':
        case 'terminal.replay':
          appendReplay(coordinator, event.payload.data)
          for (const client of coordinator.clients.values()) {
            sendServerEvent(client.socket, event.type === 'terminal.output'
              ? {
                  type: 'terminal.output',
                  payload: {
                    sessionId: coordinator.sessionId,
                    stream: event.payload.stream,
                    data: event.payload.data,
                  },
                }
              : {
                  type: 'terminal.replay',
                  payload: {
                    sessionId: coordinator.sessionId,
                    data: event.payload.data,
                  },
                })
          }
          return
        case 'terminal.exit':
          coordinator.shellActive = false
          for (const client of coordinator.clients.values()) {
            sendServerEvent(client.socket, event)
          }
          return
        case 'terminal.close':
        case 'sys.error':
        case 'sys.ping':
        case 'sys.pong':
          for (const client of coordinator.clients.values()) {
            sendServerEvent(client.socket, event)
          }
          break
        case 'terminal.writer.state':
          break
      }
    })

    upstream.on('open', () => {
      scheduleWriterRenew(coordinator)
    })

    upstream.on('close', async () => {
      for (const client of coordinator.clients.values()) {
        sendServerEvent(client.socket, {
          type: 'terminal.close',
          payload: {
            sessionId: coordinator.sessionId,
            reason: 'upstream_disconnect',
          },
        })
        client.socket.close()
      }

      coordinator.clients.clear()
      await stopCoordinator(projectId)
    })

    upstream.on('error', (error: Error) => {
      reject(error)
      for (const client of coordinator.clients.values()) {
        sendServerEvent(client.socket, {
          type: 'sys.error',
          payload: createTerminalErrorPayload('UPSTREAM_TERMINAL_ERROR', true),
        })
      }
    })
  })

  coordinators.set(projectId, coordinator)
  return coordinator
}

async function getOrCreateCoordinator(projectId: string) {
  const existing = coordinators.get(projectId)
  if (existing) {
    if (existing.idleTimer) {
      clearTimeout(existing.idleTimer)
      existing.idleTimer = null
    }
    return existing
  }

  return createCoordinator(projectId)
}

export async function attachTerminalClient(
  socket: WebSocket,
  projectId: string,
  _logger: { error: (error: unknown, message: string) => void },
) {
  const coordinator = await getOrCreateCoordinator(projectId)
  await coordinator.ready

  const clientId = nanoid()
  const client: BrowserClient = { clientId, socket }
  coordinator.clients.set(clientId, client)
  await addProjectClient(projectId, clientId)

  const writerClientId = await claimWriter(projectId, clientId)

  sendServerEvent(socket, {
    type: 'terminal.hello',
    payload: {
      protocolVersion: 'v1',
      sessionId: coordinator.sessionId,
      clientId,
      replayAvailable: coordinator.replayBuffer.length > 0,
      shellActive: coordinator.shellActive,
    },
  })

  if (coordinator.replayBuffer) {
    sendServerEvent(socket, {
      type: 'terminal.replay',
      payload: {
        sessionId: coordinator.sessionId,
        data: coordinator.replayBuffer,
      },
    })
  }

  sendServerEvent(socket, {
    type: 'terminal.writer.state',
    payload: {
      sessionId: coordinator.sessionId,
      clientId,
      writerClientId,
      role: writerClientId === clientId ? 'writer' : 'viewer',
    },
  })

  await broadcastWriterState(coordinator)

  socket.on('message', async (raw: Buffer | string) => {
    const text = typeof raw === 'string' ? raw : raw.toString()

    let payload: unknown
    try {
      payload = JSON.parse(text)
    }
    catch {
      sendServerEvent(socket, {
        type: 'sys.error',
        payload: createTerminalErrorPayload('INVALID_TERMINAL_MESSAGE', false),
      })
      return
    }

    const parsed = terminalClientEventSchema.safeParse(payload)
    if (!parsed.success) {
      sendServerEvent(socket, {
        type: 'sys.error',
        payload: createTerminalErrorPayload('INVALID_TERMINAL_EVENT', false),
      })
      return
    }

    const event = parsed.data

    switch (event.type) {
      case 'terminal.input':
      case 'terminal.resize': {
        const currentWriter = await getWriterClientId(projectId)
        if (currentWriter !== clientId) {
          sendServerEvent(socket, {
            type: 'sys.error',
            payload: createTerminalErrorPayload('TERMINAL_WRITER_REQUIRED', false),
          })
          await broadcastWriterState(coordinator)
          return
        }

        sendClientEvent(coordinator.upstream, event.type === 'terminal.input'
          ? {
              type: 'terminal.input',
              payload: {
                sessionId: coordinator.sessionId,
                data: event.payload.data,
              },
            }
          : {
              type: 'terminal.resize',
              payload: {
                sessionId: coordinator.sessionId,
                cols: event.payload.cols,
                rows: event.payload.rows,
              },
            })
        return
      }
      case 'terminal.writer.claim':
        await claimWriter(projectId, clientId)
        await broadcastWriterState(coordinator)
        return
      case 'terminal.writer.release':
        await releaseWriter(projectId, clientId)
        await broadcastWriterState(coordinator)
        return
      case 'terminal.close':
        await releaseWriter(projectId, clientId)
        await removeProjectClient(projectId, clientId)
        coordinator.clients.delete(clientId)
        await broadcastWriterState(coordinator)
        socket.close()
        if (await countProjectClients(projectId) === 0) {
          await scheduleIdleShutdown(projectId)
        }
        return
      case 'sys.ping':
        sendServerEvent(socket, {
          type: 'sys.pong',
          payload: {
            ts: event.payload.ts,
          },
        })
        break
      case 'sys.pong':
        break
    }
  })

  socket.on('close', async () => {
    await releaseWriter(projectId, clientId)
    await removeProjectClient(projectId, clientId)
    coordinator.clients.delete(clientId)
    await broadcastWriterState(coordinator)
    if (await countProjectClients(projectId) === 0) {
      await scheduleIdleShutdown(projectId)
    }
  })

  socket.on('error', async () => {
    await releaseWriter(projectId, clientId)
    await removeProjectClient(projectId, clientId)
    coordinator.clients.delete(clientId)
  })
}

export async function handleTerminalBridgeConnection(
  socket: WebSocket,
  projectId: string | undefined,
  logger: { error: (error: unknown, message: string) => void },
) {
  if (!projectId) {
    socket.close()
    return
  }

  try {
    await attachTerminalClient(socket, projectId, logger)
  }
  catch (error) {
    logger.error(error, '建立终端连接失败')
    sendServerEvent(socket, {
      type: 'sys.error',
      payload: createTerminalErrorPayload('TERMINAL_BRIDGE_FAILED', true),
    })
    socket.close()
  }
}
