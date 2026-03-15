<script setup lang="ts">
import type { XtermTerminalProps } from './types'
import { computed, ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { getTerminalColors } from '@/themes'
import { useXtermTerminal } from './composables/useXtermTerminal'

const props = withDefaults(defineProps<XtermTerminalProps>(), {
  url: '',
})

const containerRef = ref<HTMLElement | null>(null)
const { resolvedThemeId } = useTheme()

const terminalStyle = computed(() => {
  const colors = getTerminalColors(resolvedThemeId.value)

  return {
    '--cp-terminal-bg': colors.background,
    '--cp-terminal-fg': colors.foreground,
  }
})

const { clear, claimWriter, isWriter, releaseWriter } = useXtermTerminal({
  containerRef,
  props,
})

defineExpose({
  clear,
  claimWriter,
  isWriter,
  releaseWriter,
})
</script>

<template>
  <div ref="containerRef" class="terminal-frame h-full min-h-0 w-full" :style="terminalStyle" />
</template>

<style scoped lang="scss">
.terminal-frame {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 10px 0px 4px 8px;
  background: var(--cp-workspace-content-bg);
}
</style>
