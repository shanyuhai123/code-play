<script setup lang="ts">
import type { SandboxThemePanelEmits, SandboxThemePanelProps } from '../typing'
import type { ThemePreference } from '@/themes'
import { useTheme } from '@/composables/useTheme'

const props = defineProps<SandboxThemePanelProps>()
const emits = defineEmits<SandboxThemePanelEmits>()

const { themes } = useTheme()

const systemOption = {
  id: 'system' as ThemePreference,
  label: '跟随系统',
  description: '自动跟随系统明暗模式',
  previewStyle: 'linear-gradient(135deg, #f8fafc 0%, #f8fafc 50%, #0f172a 50%, #0f172a 100%)',
}
</script>

<template>
  <div class="flex flex-col gap-2 p-3">
    <button
      class="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-transparent px-3 py-3 text-left transition-colors"
      :class="props.modelValue === 'system'
        ? 'border-(--cp-workspace-highlight) bg-(--cp-accent-soft) text-(--cp-workspace-text)'
        : 'text-(--cp-workspace-text) hover:border-(--cp-workspace-border) hover:bg-(--cp-workspace-hover)'"
      @click="emits('update:modelValue', 'system')"
    >
      <span
        class="h-8 w-11 shrink-0 rounded-lg border border-(--cp-workspace-border)"
        :style="{ background: systemOption.previewStyle }"
      />
      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-2 text-sm font-medium">
          <span>{{ systemOption.label }}</span>
        </span>
        <span class="mt-1 block text-xs text-(--cp-workspace-text-muted)">{{ systemOption.description }}</span>
      </span>
    </button>

    <div class="my-1 h-px bg-(--cp-workspace-border)" />

    <button
      v-for="theme in themes" :key="theme.id"
      class="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-transparent px-3 py-3 text-left transition-colors"
      :class="props.modelValue === theme.id
        ? 'border-(--cp-workspace-highlight) bg-(--cp-accent-soft) text-(--cp-workspace-text)'
        : 'text-(--cp-workspace-text) hover:border-(--cp-workspace-border) hover:bg-(--cp-workspace-hover)'"
      @click="emits('update:modelValue', theme.id)"
    >
      <span
        class="h-8 w-11 shrink-0 rounded-lg border border-(--cp-workspace-border)"
        :style="{ background: theme.previewStyle }"
      />
      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-2 text-sm font-medium">
          <span>{{ theme.label }}</span>
        </span>
        <span class="mt-1 block text-xs text-(--cp-workspace-text-muted)">{{ theme.description }}</span>
      </span>
    </button>
  </div>
</template>
