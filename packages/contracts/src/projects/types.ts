import type { FileNode, ProjectFile, ProjectSummary, ProjectTask, SandboxSession } from '@code-play/domain'

export interface ApiResponse<T = unknown> {
  /**
   * 是否成功
   * @description 请求是否成功。
   */
  success: boolean
  /**
   * 数据
   * @description 成功时返回的业务数据。
   */
  data?: T
  /**
   * 错误
   * @description 失败时返回的错误对象。
   */
  error?: {
    /**
     * 错误码
     * @description 约定的业务错误码。
     */
    code: string
    /**
     * 错误消息
     * @description 面向调用方的错误描述。
     */
    message: string
  }
}

export interface PaginatedResponse<T> {
  /**
   * 列表
   * @description 当前页数据。
   */
  items: T[]
  /**
   * 总数
   * @description 满足条件的总记录数。
   */
  total: number
  /**
   * 页码
   * @description 当前页码，从 1 开始。
   */
  page: number
  /**
   * 页大小
   * @description 每页记录数。
   */
  pageSize: number
}

export interface CreateProjectRequest {
  /**
   * 名称
   * @description 新项目名称。
   */
  name: string
  /**
   * 模板 ID
   * @description 使用的模板标识。
   */
  templateId: string
}

export interface CreateProjectResponse {
  /**
   * 项目
   * @description 创建完成后的项目摘要。
   */
  project: ProjectSummary
}

export interface GetProjectResponse {
  /**
   * 项目
   * @description 项目摘要信息。
   */
  project: ProjectSummary
  /**
   * 文件树
   * @description 当前项目完整文件树。
   */
  files: FileNode[]
  /**
   * 任务
   * @description 仍在执行中的后台任务，没有时为空。
   */
  task: ProjectTask | null
}

export interface UpdateProjectRequest {
  /**
   * 名称
   * @description 更新后的项目名称。
   */
  name?: string
}

export interface CreateSandboxRequest {
  /**
   * 项目 ID
   * @description 需要启动沙盒的项目。
   */
  projectId: string
}

export interface ExecuteCommandRequest {
  /**
   * 命令
   * @description 要在沙盒里执行的命令。
   */
  command: string
  /**
   * 工作目录
   * @description 命令执行目录，未传时使用默认目录。
   */
  cwd?: string
}

export interface SyncProjectFileRequest {
  /**
   * 路径
   * @description 需要同步的文件路径。
   */
  path: string
  /**
   * 内容
   * @description 文件最新完整内容。
   */
  content: string
  /**
   * 版本号
   * @description 调用方持有的文件版本号。
   */
  version?: number
}

export interface SyncProjectFileResponse {
  /**
   * 文件
   * @description 持久化后的文件记录。
   */
  file: ProjectFile
}

export interface StartSandboxSessionResponse {
  /**
   * 会话
   * @description 已创建或复用的沙盒会话。
   */
  session: SandboxSession
  /**
   * 预览 URL
   * @description dev server 的预览地址，未就绪时为 null。
   */
  previewUrl: string | null
}
