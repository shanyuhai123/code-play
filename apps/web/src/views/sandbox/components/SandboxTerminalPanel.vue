<script setup lang="ts">
import type { SandboxTerminalPanelProps } from '../typing'
import { Aim, BrushFilled, Remove } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import { XtermTerminal } from '@/components/xterm-terminal'
import { useTheme } from '@/composables/useTheme'
import { getTerminalColors } from '@/themes'

const props = defineProps<SandboxTerminalPanelProps>()
const { resolvedThemeId } = useTheme()

const terminalRef = ref<InstanceType<typeof XtermTerminal> | null>(null)

const terminalUrl = computed(() => {
  if (!props.projectId || !props.ready) {
    return ''
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/api/terminal/${props.projectId}`
})

const isWriter = computed(() => terminalRef.value?.isWriter ?? false)
const terminalInteractive = computed(() => props.ready && isWriter.value)
const statusText = computed(() => (isWriter.value ? '' : '只读'))
const statusTooltip = computed(() => (isWriter.value ? '' : '当前终端为只读状态，申请后才能输入命令'))
const controlTooltip = computed(() => {
  if (!props.ready) {
    return '终端尚未就绪，暂时不能申请控制权'
  }

  return isWriter.value ? '释放当前终端控制权' : '申请并接管当前终端控制权'
})
const clearTooltip = computed(() => (props.ready ? '清空当前终端输出' : '终端尚未就绪，暂时不能清空输出'))
const terminalHint = computed(() => {
  if (!props.ready) {
    return props.bootMessage || '终端启动中，稍后可用'
  }

  return '当前为只读状态，申请控制权后才可以输入命令'
})

const terminalShellStyle = computed(() => {
  const colors = getTerminalColors(resolvedThemeId.value)

  return {
    '--cp-terminal-bg': colors.background,
    '--cp-terminal-fg': colors.foreground,
  }
})

function toggleWriter() {
  if (isWriter.value) {
    terminalRef.value?.releaseWriter()
    return
  }

  terminalRef.value?.claimWriter()
}

function clear() {
  terminalRef.value?.clear()
}
</script>

<template>
  <div class="flex h-[280px] min-h-0 shrink-0 flex-col border-t border-(--cp-workspace-border)">
    <div
      class="flex items-center justify-between gap-3 bg-(--cp-workspace-sidebar-bg) px-4 py-2 text-[13px] text-(--cp-workspace-text) font-semibold"
    >
      <div class="inline-flex min-w-0 items-center gap-[10px]">
        <span>终端</span>
        <el-tooltip v-if="!isWriter" :content="statusTooltip" placement="bottom-start" :show-after="120">
          <div
            class="inline-flex h-8 items-center justify-center gap-2 rounded-full border border-(--cp-workspace-toolbar-border) bg-(--cp-workspace-toolbar-pill-bg) px-3 text-[12px] text-(--cp-workspace-text) font-semibold leading-none shadow-[0_10px_24px_-18px_rgba(15,23,42,0.65)] backdrop-blur-[10px]"
          >
            <span class="h-2 w-2 rounded-full bg-[#8b949e] shadow-[0_0_0_4px_rgba(139,148,158,0.16)]" />
            <span>{{ statusText }}</span>
          </div>
        </el-tooltip>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-2">
        <el-tooltip :content="controlTooltip" placement="bottom" :show-after="120">
          <span class="inline-flex" :class="{ 'cursor-not-allowed': !ready }">
            <el-button
              class="terminal-icon-btn" :class="{ 'is-active': isWriter }" :disabled="!ready" size="small"
              plain circle :aria-label="isWriter ? '释放终端控制权' : '申请终端控制权'" @click="toggleWriter"
            >
              <el-icon :size="12" class="inline-flex shrink-0 items-center justify-center">
                <Remove v-if="isWriter" />
                <Aim v-else />
              </el-icon>
            </el-button>
          </span>
        </el-tooltip>

        <el-tooltip :content="clearTooltip" placement="bottom-end" :show-after="120">
          <span class="inline-flex" :class="{ 'cursor-not-allowed': !ready }">
            <el-button
              class="terminal-icon-btn" :disabled="!ready" size="small" plain circle aria-label="清空终端输出"
              @click="clear"
            >
              <el-icon :size="12" class="inline-flex shrink-0 items-center justify-center">
                <BrushFilled />
              </el-icon>
            </el-button>
          </span>
        </el-tooltip>
      </div>
    </div>

    <div
      v-if="booting || !ready"
      class="flex flex-1 bg-(--cp-workspace-content-bg) px-4 py-3"
    >
      <div
        class="flex flex-1 cursor-not-allowed items-center justify-center rounded-xl border border-(--cp-workspace-border) bg-(--cp-workspace-content-bg) text-[13px] text-(--cp-workspace-text-muted)"
      >
        {{ bootMessage }}
      </div>
    </div>
    <div v-else class="flex min-h-0 flex-1 bg-(--cp-workspace-content-bg) px-4 py-3">
      <div
        class="terminal-shell relative flex min-h-0 flex-1 overflow-hidden rounded-xl border border-(--cp-workspace-border)"
        :style="terminalShellStyle"
      >
        <div class="terminal-surface-tone" aria-hidden="true" />
        <XtermTerminal
          ref="terminalRef"
          :url="terminalUrl"
          class="terminal-content relative z-[1] flex-1 overflow-hidden bg-(--cp-workspace-content-bg)"
        />
        <el-tooltip v-if="!terminalInteractive" :content="terminalHint" placement="top" :show-after="120">
          <div class="terminal-readonly-mask" :aria-label="terminalHint" />
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.terminal-shell {
  background: var(--cp-workspace-content-bg);
  border-color: color-mix(in srgb, var(--cp-workspace-border) 82%, var(--cp-terminal-bg));
  box-shadow: inset 0 1px 0 color-mix(in srgb, white 45%, transparent);
}

.terminal-surface-tone {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: color-mix(in srgb, var(--cp-terminal-bg) 18%, var(--cp-workspace-content-bg));
}

.terminal-readonly-mask {
  position: absolute;
  inset: 0;
  z-index: 2;
  cursor: not-allowed;
  background: transparent;
}

:deep(.terminal-icon-btn.el-button) {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  border-radius: 10px;
  line-height: 1;
  border-color: var(--cp-workspace-toolbar-border);
  background: var(--cp-workspace-toolbar-bg);
  color: var(--cp-workspace-text);
  box-shadow: 0 10px 24px -18px rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;

  >span,
  .el-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    line-height: 1;
  }

  svg {
    display: block;
  }

  &:hover {
    border-color: color-mix(in srgb, var(--cp-workspace-toolbar-border) 45%, var(--cp-workspace-highlight));
    background: var(--cp-workspace-toolbar-hover);
    transform: translateY(-1px);
  }

  &.is-active {
    border-color: color-mix(in srgb, var(--cp-workspace-toolbar-active-bg) 70%, white 10%);
    background: linear-gradient(135deg, var(--cp-workspace-toolbar-active-bg), color-mix(in srgb, var(--cp-workspace-toolbar-active-bg) 78%, black));
    color: var(--cp-workspace-toolbar-active-text);
  }

  &:focus-visible {
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--cp-workspace-content-bg) 78%, transparent),
      0 0 0 4px color-mix(in srgb, var(--cp-workspace-highlight) 65%, transparent);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.52;
    transform: none;
    box-shadow: none;
  }
}
</style>
