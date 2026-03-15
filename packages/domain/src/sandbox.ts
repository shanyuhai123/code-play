export const SandboxRuntimeStatus = {
  NOT_FOUND: 'not_found',
  STARTING: 'starting',
  RUNNING: 'running',
  IDLE: 'idle',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  ERROR: 'error',
} as const

export type SandboxRuntimeStatusValue = (typeof SandboxRuntimeStatus)[keyof typeof SandboxRuntimeStatus]

export type SandboxStatus = 'creating' | SandboxRuntimeStatusValue

export interface SandboxSession {
  /**
   * 会话 ID
   * @description 沙盒会话主键。
   */
  id: string
  /**
   * 项目 ID
   * @description 当前会话所属项目。
   */
  projectId: string
  /**
   * 容器 ID
   * @description 对应的 Docker 容器标识。
   */
  containerId: string
  /**
   * 状态
   * @description 当前沙盒运行时状态。
   */
  status: SandboxRuntimeStatusValue
  /**
   * 创建时间
   * @description 会话创建时间。
   */
  createdAt: Date
  /**
   * 更新时间
   * @description 会话最后更新时间。
   */
  updatedAt: Date
}

export interface SandboxConfig {
  /**
   * 配置 ID
   * @description 沙盒配置主键。
   */
  id: string
  /**
   * 项目 ID
   * @description 当前配置所属项目。
   */
  projectId: string
  /**
   * 容器 ID
   * @description 已分配的容器标识，未启动时可能为空。
   */
  containerId?: string
  /**
   * 状态
   * @description 当前沙盒运行状态。
   */
  status: SandboxRuntimeStatusValue
  /**
   * 端口
   * @description 暴露给外部的服务端口。
   */
  port?: number
  /**
   * 创建时间
   * @description 配置创建时间。
   */
  createdAt: Date
  /**
   * 更新时间
   * @description 配置最后更新时间。
   */
  updatedAt: Date
}

export interface SandboxCommand {
  /**
   * 命令
   * @description 要在沙盒中执行的命令。
   */
  command: string
  /**
   * 工作目录
   * @description 命令执行目录，未传时使用默认工作目录。
   */
  cwd?: string
}

export interface SandboxCommandResult {
  /**
   * 标准输出
   * @description 命令执行产生的 stdout 内容。
   */
  stdout: string
  /**
   * 标准错误
   * @description 命令执行产生的 stderr 内容。
   */
  stderr: string
  /**
   * 退出码
   * @description 进程退出状态码。
   */
  exitCode: number
}
