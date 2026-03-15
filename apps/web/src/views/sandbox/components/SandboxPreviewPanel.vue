<script setup lang="ts">
import type { SandboxPreviewPanelProps } from '../typing'
import { RefreshRight } from '@element-plus/icons-vue'
import { computed, onUnmounted, ref, watch } from 'vue'

const props = defineProps<SandboxPreviewPanelProps>()

const iframeKey = ref(0)
const probeAttempt = ref(0)
const previewReachable = ref(false)
const previewStatus = ref<'idle' | 'booting' | 'probing' | 'ready'>('idle')

let probeTimer: ReturnType<typeof setTimeout> | null = null
let probeRunId = 0

const showIframe = computed(() => props.ready && !!props.previewUrl && previewReachable.value)
const placeholderMessage = computed(() => {
  if (props.booting) {
    return props.bootMessage
  }

  if (!props.ready) {
    return '正在初始化环境...'
  }

  if (!props.previewUrl) {
    return '正在启动开发服务器并准备预览...'
  }

  if (previewStatus.value === 'probing') {
    return probeAttempt.value <= 1
      ? '预览服务启动中，正在自动检测...'
      : `预览服务启动中，正在自动检测并刷新（第 ${probeAttempt.value} 次）...`
  }

  return '正在准备预览...'
})

function refresh() {
  iframeKey.value++
}

function clearProbeTimer() {
  if (probeTimer) {
    clearTimeout(probeTimer)
    probeTimer = null
  }
}

function scheduleProbe(url: string, runId: number, delay = 3000) {
  clearProbeTimer()
  probeTimer = setTimeout(() => {
    void probePreview(url, runId)
  }, delay)
}

async function probePreview(url: string, runId: number) {
  if (runId !== probeRunId || !props.ready || !props.previewUrl) {
    return
  }

  previewStatus.value = 'probing'
  probeAttempt.value += 1

  try {
    await fetch(url, {
      cache: 'no-store',
      mode: 'no-cors',
    })

    if (runId !== probeRunId) {
      return
    }

    previewReachable.value = true
    previewStatus.value = 'ready'
    iframeKey.value += 1
  }
  catch {
    scheduleProbe(url, runId)
  }
}

watch(
  () => [props.ready, props.previewUrl, props.booting] as const,
  ([ready, url, booting]) => {
    probeRunId += 1
    clearProbeTimer()
    probeAttempt.value = 0
    previewReachable.value = false

    if (booting) {
      previewStatus.value = 'booting'
      return
    }

    if (!ready || !url) {
      previewStatus.value = ready ? 'probing' : 'idle'
      return
    }

    previewStatus.value = 'probing'
    void probePreview(url, probeRunId)
  },
  { immediate: true },
)

onUnmounted(() => {
  probeRunId += 1
  clearProbeTimer()
})
</script>

<template>
  <div class="flex min-h-0 min-w-0 flex-1 flex-col border-l border-(--cp-workspace-border)">
    <div
      class="flex items-center justify-between gap-3 bg-(--cp-workspace-sidebar-bg) px-4 py-2 text-[13px] text-(--cp-workspace-text) font-semibold"
    >
      <span>预览</span>
      <div class="flex items-center gap-2">
        <el-tooltip content="刷新预览" placement="bottom-end" :show-after="120">
          <span class="inline-flex" :class="{ 'cursor-not-allowed': !showIframe }">
            <el-button
              class="preview-icon-btn" :disabled="!showIframe" size="small" plain circle
              aria-label="刷新预览" @click="refresh"
            >
              <el-icon :size="12" class="inline-flex shrink-0 items-center justify-center">
                <RefreshRight />
              </el-icon>
            </el-button>
          </span>
        </el-tooltip>
      </div>
    </div>

    <div v-if="showIframe" class="flex min-h-0 flex-1 flex-col bg-(--cp-workspace-content-bg) px-4 py-3">
      <div class="mb-2 flex items-center gap-2">
        <div
          class="flex min-w-0 flex-1 items-center rounded-lg border border-(--cp-workspace-border) bg-(--cp-workspace-toolbar-bg) px-3 py-1 text-[12px] text-(--cp-workspace-text-muted)"
        >
          <span class="truncate">{{ previewUrl }}</span>
        </div>
      </div>
      <iframe
        :key="iframeKey"
        :src="previewUrl!"
        class="min-h-0 flex-1 rounded-lg border border-(--cp-workspace-border) bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>

    <div
      v-else
      class="flex flex-1 bg-(--cp-workspace-content-bg) px-4 py-3"
    >
      <div
        class="flex flex-1 cursor-not-allowed items-center justify-center rounded-xl border border-(--cp-workspace-border) bg-(--cp-workspace-content-bg) text-[13px] text-(--cp-workspace-text-muted)"
      >
        {{ placeholderMessage }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.preview-icon-btn.el-button) {
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
