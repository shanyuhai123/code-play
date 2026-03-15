import type { FileNode } from '@code-play/domain'
import type { MonacoFile } from '@/components/monaco-editor'
import type { MonacoTheme, ThemePreference } from '@/themes'

/** Activity Bar 面板标识 */
export type ActivityPanelId = 'explorer' | 'theme'

/** Activity Bar 条目 */
export interface ActivityItem {
  /** 面板 ID */
  id: ActivityPanelId
  /** 显示标签 */
  label: string
  /** Element Plus 图标名 */
  icon: string
}

export interface SandboxActivityBarProps {
  /** 当前激活的面板 ID */
  activePanel: ActivityPanelId
  /** Activity Bar 条目列表 */
  items: ActivityItem[]
  /** 侧边栏是否可见 */
  sidebarVisible: boolean
}

export interface SandboxActivityBarEmits {
  /** 切换面板 */
  toggle: [id: ActivityPanelId]
}

export interface SandboxSidebarProps {
  /** 侧边栏标题 */
  title: string
}

export interface SandboxTitleBarProps {
  /** 项目名称 */
  projectName?: string
}

export interface SandboxTitleBarEmits {
  /** 返回 */
  back: []
}

export interface SandboxThemePanelProps {
  /** 当前选中的主题 */
  modelValue: ThemePreference
}

export interface SandboxThemePanelEmits {
  /** 选择主题 */
  'update:modelValue': [theme: ThemePreference]
}

export interface SandboxFileTreeProps {
  /**
   * 启动消息
   * @description 沙盒启动中的提示文案。
   */
  bootMessage: string
  /**
   * 启动中
   * @description 当前是否处于初始化阶段。
   */
  booting: boolean
  /**
   * 文件树
   * @description 当前项目文件树。
   */
  fileTree: FileNode[]
  /**
   * 就绪
   * @description 沙盒与文件数据是否已可用。
   */
  ready: boolean
}

export interface SandboxFileTreeEmits {
  /**
   * 打开
   * @description 点击文件节点时触发。
   */
  open: [file: FileNode]
}

export interface SandboxEditorPanelProps {
  /**
   * 启动消息
   * @description 编辑器占位时显示的提示文案。
   */
  bootMessage: string
  /**
   * 启动中
   * @description 当前是否仍在初始化沙盒。
   */
  booting: boolean
  /**
   * 文件列表
   * @description 传给 Monaco 的工作区文件集合。
   */
  files: MonacoFile[]
  /**
   * 文件路径
   * @description 当前打开文件的路径。
   */
  filePath: string
  /**
   * 语言
   * @description 当前文件对应的语言 ID。
   */
  language: string
  /**
   * 当前值
   * @description 当前编辑器文本内容。
   */
  modelValue: string
  /**
   * 就绪
   * @description 编辑器是否可以正常进入编辑态。
   */
  ready: boolean
  /**
   * 模板 ID
   * @description 当前项目模板标识。
   */
  templateId?: string
  /**
   * 主题
   * @description Monaco 编辑器主题。
   */
  theme?: MonacoTheme
  /**
   * 工作区 ID
   * @description 当前工作区标识，用于隔离 Monaco 模型。
   */
  workspaceId?: string
}

export interface SandboxEditorPanelEmits {
  /**
   * 导航
   * @description 在编辑器内点击可解析导入路径时触发。
   */
  'navigate': [path: string]
  /**
   * 更新值
   * @description 编辑器内容变化时触发。
   */
  'update:modelValue': [value: string]
}

export interface SandboxTerminalPanelProps {
  /**
   * 启动消息
   * @description 终端尚未就绪时显示的提示文案。
   */
  bootMessage: string
  /**
   * 启动中
   * @description 当前是否仍在初始化沙盒。
   */
  booting: boolean
  /**
   * 项目 ID
   * @description 当前终端所属项目。
   */
  projectId: string
  /**
   * 就绪
   * @description 终端是否允许建立连接。
   */
  ready: boolean
}

export interface SandboxPreviewPanelProps {
  /**
   * 启动消息
   * @description 预览面板尚未就绪时显示的提示文案。
   */
  bootMessage: string
  /**
   * 启动中
   * @description 当前是否仍在初始化沙盒。
   */
  booting: boolean
  /**
   * 预览 URL
   * @description dev server 的预览地址，未就绪时为 null。
   */
  previewUrl: string | null
  /**
   * 就绪
   * @description 沙盒是否已可用。
   */
  ready: boolean
}
