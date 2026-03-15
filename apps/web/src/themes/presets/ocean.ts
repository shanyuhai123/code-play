import type { ThemeDefinition } from '../types'

export const oceanTheme: ThemeDefinition = {
  id: 'ocean',
  label: '海洋',
  description: '清凉通透的蓝绿海洋浅色变体',
  base: 'light',
  previewStyle: 'linear-gradient(135deg, #ecfdf5 30%, #67e8f9 100%)',
  terminalColors: { background: '#f6fefc', foreground: '#0c3e38' },
}
