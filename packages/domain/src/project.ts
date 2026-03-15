export interface Template {
  /**
   * 模板 ID
   * @description 模板唯一标识。
   */
  id: string
  /**
   * 模板名称
   * @description 前端展示用名称。
   */
  name: string
  /**
   * 图标
   * @description 模板图标资源名或路径。
   */
  icon: string
  /**
   * 描述
   * @description 模板说明文案。
   */
  description: string
  /**
   * Vite 模板
   * @description 用于创建项目的 Vite 模板标识。
   */
  viteTemplate: string
}

export type ProjectStatus = 'creating' | 'ready' | 'failed' | 'archived'

export type ProjectTaskStatus = 'pending' | 'running' | 'succeeded' | 'failed'

export interface Project {
  /**
   * 项目 ID
   * @description 项目主键。
   */
  id: string
  /**
   * 项目名称
   * @description 用户可见的项目名称。
   */
  name: string
  /**
   * 模板 ID
   * @description 当前项目使用的模板。
   */
  templateId: string
  /**
   * 状态
   * @description 项目当前生命周期状态。
   */
  status: ProjectStatus
  /**
   * 错误信息
   * @description 创建或运行失败时的错误说明。
   */
  errorMessage: string | null
  /**
   * 创建时间
   * @description 项目创建时间。
   */
  createdAt: Date
  /**
   * 更新时间
   * @description 项目最后更新时间。
   */
  updatedAt: Date
  /**
   * 用户 ID
   * @description 归属用户标识，匿名项目时为空。
   */
  userId: string | null
}

export interface FileNode {
  /**
   * 名称
   * @description 文件或目录名称。
   */
  name: string
  /**
   * 路径
   * @description 相对于项目根目录的规范化路径。
   */
  path: string
  /**
   * 类型
   * @description 当前节点是文件还是目录。
   */
  type: 'file' | 'directory'
  /**
   * 内容
   * @description 文件内容，仅文件节点有值。
   */
  content?: string
  /**
   * 子节点
   * @description 目录下的子文件树，仅目录节点有值。
   */
  children?: FileNode[]
}

export interface ProjectFile {
  /**
   * 文件 ID
   * @description 文件记录主键。
   */
  id: string
  /**
   * 项目 ID
   * @description 文件所属项目。
   */
  projectId: string
  /**
   * 路径
   * @description 文件在项目中的路径。
   */
  path: string
  /**
   * 内容
   * @description 文件当前完整内容。
   */
  content: string
  /**
   * 版本号
   * @description 文件内容版本，用于同步控制。
   */
  version: number
  /**
   * 创建时间
   * @description 文件记录创建时间。
   */
  createdAt: Date
  /**
   * 更新时间
   * @description 文件记录最后更新时间。
   */
  updatedAt: Date
}

export interface ProjectSummary extends Project {
  /**
   * 活跃会话 ID
   * @description 当前活跃沙盒会话，没有时为空。
   */
  activeSessionId?: string | null
}

export interface ProjectTask {
  /**
   * 任务 ID
   * @description 任务主键。
   */
  id: string
  /**
   * 项目 ID
   * @description 任务所属项目。
   */
  projectId: string
  /**
   * 类型
   * @description 当前任务类型。
   */
  type: 'create_template'
  /**
   * 状态
   * @description 后台任务执行状态。
   */
  status: ProjectTaskStatus
  /**
   * 输出
   * @description 任务日志或标准输出内容。
   */
  output: string | null
  /**
   * 错误信息
   * @description 任务失败时的错误说明。
   */
  errorMessage: string | null
  /**
   * 开始时间
   * @description 任务开始执行的时间。
   */
  startedAt: Date | null
  /**
   * 结束时间
   * @description 任务结束执行的时间。
   */
  finishedAt: Date | null
  /**
   * 创建时间
   * @description 任务记录创建时间。
   */
  createdAt: Date
  /**
   * 更新时间
   * @description 任务记录最后更新时间。
   */
  updatedAt: Date
}
