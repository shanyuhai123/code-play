import type * as Monaco from 'monaco-editor'

export interface MonacoFile {
  /**
   * 路径
   * @description 文件在工作区中的相对路径。
   */
  path: string
  /**
   * 内容
   * @description 文件完整文本内容。
   */
  content: string
}

export interface MonacoEditorProps {
  /**
   * 当前值
   * @description 当前编辑器显示的文本值。
   */
  modelValue: string
  /**
   * 文件列表
   * @description 当前工作区内可供导航和建模的文件集合。
   */
  files?: MonacoFile[]
  /**
   * 语言
   * @description 当前模型的语言 ID。
   */
  language?: string
  /**
   * 路径
   * @description 当前打开文件的路径。
   */
  path?: string
  /**
   * 只读
   * @description 是否禁用编辑操作。
   */
  readonly?: boolean
  /**
   * 模板 ID
   * @description 当前项目模板标识，用于配置语言服务。
   */
  templateId?: string
  /**
   * 主题
   * @description Monaco 编辑器主题。
   */
  theme?: 'vs' | 'vs-dark' | 'hc-black'
  /**
   * 工作区 ID
   * @description 当前编辑器所属工作区标识。
   */
  workspaceId?: string
  /**
   * 额外选项
   * @description 透传给 Monaco 的编辑器构造参数。
   */
  options?: Monaco.editor.IStandaloneEditorConstructionOptions
}
