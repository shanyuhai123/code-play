import type { TerminalErrorCode } from './errors'

export type TerminalProtocolVersion = 'v1'

export type TerminalStreamKind = 'stdout' | 'stderr' | 'system'

export type TerminalCloseReason
  = | 'client_disconnect'
    | 'session_not_found'
    | 'session_terminated'
    | 'shell_exited'
    | 'upstream_disconnect'
    | 'internal_error'
    | 'heartbeat_timeout'

export interface TerminalHelloEvent {
  /**
   * 类型
   * @description 终端握手事件类型。
   */
  type: 'terminal.hello'
  /**
   * 载荷
   * @description 握手阶段返回的会话元信息。
   */
  payload: {
    /**
     * 协议版本
     * @description 当前终端通信协议版本。
     */
    protocolVersion: TerminalProtocolVersion
    /**
     * 会话 ID
     * @description 当前终端会话标识。
     */
    sessionId: string
    /**
     * 客户端 ID
     * @description 当前连接客户端的唯一标识。
     */
    clientId: string
    /**
     * 可回放
     * @description 服务端是否持有历史输出可供回放。
     */
    replayAvailable: boolean
    /**
     * Shell 活跃
     * @description 终端 shell 进程是否仍在运行。
     */
    shellActive: boolean
  }
}

export interface TerminalInputEvent {
  /**
   * 类型
   * @description 终端输入事件类型。
   */
  type: 'terminal.input'
  /**
   * 载荷
   * @description 发送给终端的输入数据。
   */
  payload: {
    /**
     * 会话 ID
     * @description 输入目标的终端会话标识。
     */
    sessionId: string
    /**
     * 数据
     * @description 原始终端输入内容。
     */
    data: string
  }
}

export interface TerminalResizeEvent {
  /**
   * 类型
   * @description 终端尺寸变化事件类型。
   */
  type: 'terminal.resize'
  /**
   * 载荷
   * @description 新的终端窗口尺寸。
   */
  payload: {
    /**
     * 会话 ID
     * @description 需要调整尺寸的终端会话。
     */
    sessionId: string
    /**
     * 列数
     * @description 终端列数。
     */
    cols: number
    /**
     * 行数
     * @description 终端行数。
     */
    rows: number
  }
}

export interface TerminalWriterClaimEvent {
  /**
   * 类型
   * @description 申请写权限事件类型。
   */
  type: 'terminal.writer.claim'
  /**
   * 载荷
   * @description 写权限申请参数。
   */
  payload: {
    /**
     * 会话 ID
     * @description 申请写权限的终端会话。
     */
    sessionId: string
  }
}

export interface TerminalWriterReleaseEvent {
  /**
   * 类型
   * @description 释放写权限事件类型。
   */
  type: 'terminal.writer.release'
  /**
   * 载荷
   * @description 写权限释放参数。
   */
  payload: {
    /**
     * 会话 ID
     * @description 释放写权限的终端会话。
     */
    sessionId: string
  }
}

export interface TerminalOutputEvent {
  /**
   * 类型
   * @description 终端输出事件类型。
   */
  type: 'terminal.output'
  /**
   * 载荷
   * @description 终端实时输出内容。
   */
  payload: {
    /**
     * 会话 ID
     * @description 输出所属的终端会话。
     */
    sessionId: string
    /**
     * 流类型
     * @description 输出来自 stdout、stderr 或系统流。
     */
    stream: TerminalStreamKind
    /**
     * 数据
     * @description 输出文本内容。
     */
    data: string
  }
}

export interface TerminalReplayEvent {
  /**
   * 类型
   * @description 历史输出回放事件类型。
   */
  type: 'terminal.replay'
  /**
   * 载荷
   * @description 服务端缓存的历史终端输出。
   */
  payload: {
    /**
     * 会话 ID
     * @description 需要回放的终端会话。
     */
    sessionId: string
    /**
     * 数据
     * @description 历史输出文本。
     */
    data: string
  }
}

export interface TerminalWriterStateEvent {
  /**
   * 类型
   * @description 终端写权限状态变化事件类型。
   */
  type: 'terminal.writer.state'
  /**
   * 载荷
   * @description 当前客户端与写权限持有者的关系。
   */
  payload: {
    /**
     * 会话 ID
     * @description 当前终端会话。
     */
    sessionId: string
    /**
     * 客户端 ID
     * @description 当前接收该事件的客户端标识。
     */
    clientId: string
    /**
     * 写者 ID
     * @description 当前持有写权限的客户端标识，没有时为空。
     */
    writerClientId: string | null
    /**
     * 角色
     * @description 当前客户端在该会话中的角色。
     */
    role: 'viewer' | 'writer'
  }
}

export interface TerminalExitEvent {
  /**
   * 类型
   * @description 终端进程退出事件类型。
   */
  type: 'terminal.exit'
  /**
   * 载荷
   * @description 终端退出结果。
   */
  payload: {
    /**
     * 会话 ID
     * @description 已退出的终端会话。
     */
    sessionId: string
    /**
     * 退出码
     * @description shell 进程退出状态码。
     */
    code: number
    /**
     * 原因
     * @description 服务端记录的退出原因说明。
     */
    reason: string
  }
}

export interface TerminalCloseEvent {
  /**
   * 类型
   * @description 终端连接关闭事件类型。
   */
  type: 'terminal.close'
  /**
   * 载荷
   * @description 关闭连接时的上下文信息。
   */
  payload: {
    /**
     * 会话 ID
     * @description 被关闭的终端会话。
     */
    sessionId: string
    /**
     * 关闭原因
     * @description 当前连接关闭的原因。
     */
    reason: TerminalCloseReason
  }
}

export interface TerminalPingEvent {
  /**
   * 类型
   * @description 心跳请求事件类型。
   */
  type: 'sys.ping'
  /**
   * 载荷
   * @description 心跳请求数据。
   */
  payload: {
    /**
     * 时间戳
     * @description 心跳发送时间戳。
     */
    ts: number
  }
}

export interface TerminalPongEvent {
  /**
   * 类型
   * @description 心跳响应事件类型。
   */
  type: 'sys.pong'
  /**
   * 载荷
   * @description 心跳响应数据。
   */
  payload: {
    /**
     * 时间戳
     * @description 回显的心跳时间戳。
     */
    ts: number
  }
}

export interface TerminalErrorEvent {
  /**
   * 类型
   * @description 终端错误事件类型。
   */
  type: 'sys.error'
  /**
   * 载荷
   * @description 面向客户端的错误信息。
   */
  payload: {
    /**
     * 错误码
     * @description 终端错误标识。
     */
    code: TerminalErrorCode
    /**
     * 消息
     * @description 错误详细说明。
     */
    message: string
    /**
     * 可重试
     * @description 当前错误是否允许客户端重试。
     */
    retryable: boolean
  }
}

export type TerminalClientEvent
  = | TerminalInputEvent
    | TerminalResizeEvent
    | TerminalWriterClaimEvent
    | TerminalWriterReleaseEvent
    | TerminalCloseEvent
    | TerminalPingEvent
    | TerminalPongEvent

export type TerminalServerEvent
  = | TerminalHelloEvent
    | TerminalOutputEvent
    | TerminalReplayEvent
    | TerminalWriterStateEvent
    | TerminalExitEvent
    | TerminalCloseEvent
    | TerminalPingEvent
    | TerminalPongEvent
    | TerminalErrorEvent

export type TerminalEvent = TerminalClientEvent | TerminalServerEvent
