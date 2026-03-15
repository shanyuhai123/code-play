import type { MonacoTheme, ThemeId, ThemePreference } from '@/themes'
import { usePreferredDark, useStorage } from '@vueuse/core'
import { computed, watch } from 'vue'
import { getMonacoTheme, getTheme, getThemes } from '@/themes'

const themePreference = useStorage<ThemePreference>('code-play-theme', 'system')
const preferredDark = usePreferredDark()

const resolvedThemeId = computed<ThemeId>(() => {
  if (themePreference.value === 'system') {
    return preferredDark.value ? 'dark' : 'light'
  }

  return themePreference.value
})

const resolvedBase = computed(() => getTheme(resolvedThemeId.value).base)
const isDark = computed(() => resolvedBase.value === 'dark')
const monacoTheme = computed<MonacoTheme>(() => getMonacoTheme(resolvedThemeId.value))

let initialized = false

function syncTheme(themeId: ThemeId) {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  const def = getTheme(themeId)
  root.classList.toggle('dark', def.base === 'dark')
  root.dataset.theme = themeId
  root.style.colorScheme = def.base
}

export function initializeTheme() {
  if (initialized) {
    return
  }

  initialized = true
  watch(resolvedThemeId, syncTheme, { immediate: true })
}

export function useTheme() {
  return {
    isDark,
    monacoTheme,
    resolvedThemeId,
    themePreference,
    themes: getThemes(),
  }
}
