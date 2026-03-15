import type { Project } from '@code-play/domain'

export interface ProjectCardProps {
  /**
   * 项目
   * @description 当前卡片展示的项目数据。
   */
  project: Project
}

export interface ProjectCardEmits {
  /**
   * 打开
   * @description 触发打开项目时传出的项目 ID。
   */
  open: [id: string]
  /**
   * 重命名
   * @description 触发重命名时传出的项目对象。
   */
  rename: [project: Project]
  /**
   * 删除
   * @description 触发删除时传出的项目对象。
   */
  delete: [project: Project]
}

export interface CreateProjectDialogEmits {
  /**
   * 已创建
   * @description 确认创建时传出的名称和模板 ID。
   */
  created: [name: string, templateId: string]
}

export interface CreateProjectDialogProps {
  /**
   * 加载中
   * @description 当前是否处于创建请求中。
   */
  loading?: boolean
}

export interface RenameProjectDialogProps {
  /**
   * 项目
   * @description 当前要重命名的项目，没有时表示对话框未激活。
   */
  project: Project | null
}

export interface RenameProjectDialogEmits {
  /**
   * 已重命名
   * @description 提交重命名时传出的项目 ID 和新名称。
   */
  renamed: [id: string, name: string]
}
