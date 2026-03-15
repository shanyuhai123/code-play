import type { ThemeDefinition } from '../types'

export const pinkTheme: ThemeDefinition = {
  id: 'pink',
  label: '粉色',
  description: '温柔浪漫的粉色浅色变体',
  base: 'light',
  previewStyle: 'linear-gradient(135deg, #fdf2f8 40%, #f9a8d4 100%)',
  terminalColors: { background: '#fff8fb', foreground: '#6b1434' },
}
