import type { MonacoTheme, ThemeDefinition, ThemeId } from './types'
import { darkTheme, lightTheme, oceanTheme, pinkTheme } from './presets'

const themes: ThemeDefinition[] = [
  lightTheme,
  darkTheme,
  pinkTheme,
  oceanTheme,
]

const themeMap = new Map<ThemeId, ThemeDefinition>(
  themes.map(t => [t.id, t]),
)

export function getThemes(): ThemeDefinition[] {
  return themes
}

export function getTheme(id: ThemeId): ThemeDefinition {
  return themeMap.get(id) ?? lightTheme
}

export function getMonacoTheme(id: ThemeId): MonacoTheme {
  const def = getTheme(id)
  return def.monacoTheme ?? (def.base === 'dark' ? 'vs-dark' : 'vs')
}

export function getTerminalColors(id: ThemeId): { background: string, foreground: string } {
  const def = getTheme(id)

  if (def.terminalColors) {
    return def.terminalColors
  }

  return def.base === 'dark'
    ? { background: '#1e1e1e', foreground: '#d4d4d4' }
    : { background: '#ffffff', foreground: '#1f2937' }
}
