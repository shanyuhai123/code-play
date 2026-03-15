function resolveTerminalErrorMessage(code: string) {
  switch (code) {
    case 'INVALID_UPSTREAM_MESSAGE':
      return '上游终端消息解析失败'
    case 'UPSTREAM_TERMINAL_ERROR':
      return '上游终端连接异常'
    case 'INVALID_TERMINAL_MESSAGE':
      return '终端消息解析失败'
    case 'INVALID_TERMINAL_EVENT':
      return '终端消息格式非法'
    case 'TERMINAL_WRITER_REQUIRED':
      return '当前终端为只读模式，请先接管终端'
    case 'TERMINAL_BRIDGE_FAILED':
      return '终端桥接失败'
    case 'TERMINAL_CONNECT_FAILED':
      return '终端连接失败'
    case 'TERMINAL_STREAM_ERROR':
      return '终端流异常'
    default:
      return ''
  }
}

export function getTerminalCloseMessage(reason: string) {
  switch (reason) {
    case 'session_not_found':
      return '终端会话不存在'
    case 'session_terminated':
      return '终端会话已结束'
    case 'shell_exited':
      return 'Shell 已退出'
    case 'upstream_disconnect':
      return '终端服务连接已断开'
    case 'internal_error':
      return '终端发生内部错误'
    case 'heartbeat_timeout':
      return '终端连接超时'
    case 'client_disconnect':
    default:
      return ''
  }
}

export function getTerminalDisplayErrorMessage(code: string, fallbackMessage?: string) {
  return resolveTerminalErrorMessage(code) || fallbackMessage || '终端发生未知错误'
}

export function createTerminalErrorPayload<TCode extends string>(
  code: TCode,
  retryable: boolean,
): { code: TCode, message: string, retryable: boolean } {
  return {
    code,
    message: getTerminalDisplayErrorMessage(code),
    retryable,
  }
}
