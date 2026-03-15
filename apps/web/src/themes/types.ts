export type ThemeBase = 'light' | 'dark'
export type ThemeId = 'light' | 'dark' | 'pink' | 'ocean'
export type ThemePreference = ThemeId | 'system'
export type MonacoTheme = 'vs' | 'vs-dark'

/** 主题定义 */
export interface ThemeDefinition {
  /** 唯一标识 */
  id: ThemeId
  /** 显示名称 */
  label: string
  /** 简短描述 */
  description: string
  /** 基调分类，决定 dark class / Element Plus / 编辑器基础配色 */
  base: ThemeBase
  /** 主题面板预览渐变 */
  previewStyle: string
  /** Monaco 主题覆盖，默认由 base 推导 */
  monacoTheme?: MonacoTheme
  /** xterm 终端配色覆盖，默认由 base 推导 */
  terminalColors?: { background: string, foreground: string }
}
