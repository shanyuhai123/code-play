import type { TerminalClientEvent } from '@code-play/contracts'
import type { Terminal } from 'xterm'
import { terminalServerEventSchema } from '@code-play/contracts'
import { getTerminalCloseMessage, getTerminalDisplayErrorMessage } from '@code-play/shared'

function normalizeTerminalText(text: string) {
  return text.replace(/\r?\n/g, '\r\n')
}

export interface TerminalConnection {
  /**
   * 发送
   * @description 向服务端发送一个终端客户端事件。
   */
  send: (event: TerminalClientEvent) => void
  /**
   * 关闭
   * @description 主动关闭当前 WebSocket 连接。
   */
  close: () => void
}

export interface ConnectionCallbacks {
  /**
   * 握手回调
   * @description 收到 terminal.hello 后触发。
   */
  onHello: (sessionId: string, clientId: string) => void
  /**
   * 写者状态回调
   * @description 写权限持有者变化时触发。
   */
  onWriterState: (writerClientId: string | null) => void
  /**
   * 终端关闭回调
   * @description 收到终端关闭或退出事件时触发。
   */
  onTerminalClosed: () => void
  /**
   * 断开回调
   * @description WebSocket 连接关闭时触发。
   */
  onDisconnect: () => void
}

export function connectTerminal(
  url: string,
  terminal: Terminal,
  callbacks: ConnectionCallbacks,
): TerminalConnection {
  const ws = new WebSocket(url)

  function send(event: TerminalClientEvent) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event))
    }
  }

  ws.onmessage = (event) => {
    if (typeof event.data !== 'string') {
      return
    }

    let payload: unknown
    try {
      payload = JSON.parse(event.data)
    }
    catch {
      return
    }

    const parsed = terminalServerEventSchema.safeParse(payload)
    if (!parsed.success) {
      return
    }

    const message = parsed.data

    switch (message.type) {
      case 'terminal.hello': {
        callbacks.onHello(message.payload.sessionId, message.payload.clientId)
        terminal.writeln('终端已连接')
        terminal.writeln('')

        if (terminal.cols && terminal.rows) {
          send({
            type: 'terminal.resize',
            payload: {
              sessionId: message.payload.sessionId,
              cols: terminal.cols,
              rows: terminal.rows,
            },
          })
        }
        return
      }
      case 'terminal.output':
      case 'terminal.replay': {
        terminal.write(normalizeTerminalText(message.payload.data))
        return
      }
      case 'terminal.writer.state': {
        callbacks.onWriterState(message.payload.writerClientId)
        return
      }
      case 'terminal.exit': {
        callbacks.onTerminalClosed()
        terminal.writeln('')
        terminal.writeln(`终端已退出 (code ${message.payload.code})`)
        return
      }
      case 'terminal.close': {
        callbacks.onTerminalClosed()
        const closeMessage = getTerminalCloseMessage(message.payload.reason)
        if (closeMessage) {
          terminal.writeln('')
          terminal.writeln(closeMessage)
        }
        return
      }
      case 'sys.error': {
        const errorMessage = getTerminalDisplayErrorMessage(message.payload.code, message.payload.message)
        terminal.writeln('')
        terminal.writeln(`终端错误: ${errorMessage}`)
        return
      }
      case 'sys.ping': {
        send({ type: 'sys.pong', payload: { ts: message.payload.ts } })
        break
      }
      case 'sys.pong': {
        break
      }
    }
  }

  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  ws.onclose = () => {
    callbacks.onDisconnect()
  }

  return { send, close: () => ws.close() }
}
