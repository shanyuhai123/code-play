<script setup lang="ts">
import type { SandboxEditorPanelEmits, SandboxEditorPanelProps } from '../typing'
import { MonacoEditor } from '@/components/monaco-editor'

const props = defineProps<SandboxEditorPanelProps>()

const emits = defineEmits<SandboxEditorPanelEmits>()
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div
      v-if="booting || !ready"
      class="flex h-full items-center justify-center bg-(--cp-workspace-content-bg) text-(--cp-workspace-text-muted)"
    >
      {{ bootMessage }}
    </div>

    <div
      v-else-if="!filePath"
      class="flex h-full items-center justify-center bg-(--cp-workspace-content-bg) text-(--cp-workspace-text-muted)"
    >
      请选择要编辑的文件
    </div>

    <div v-else class="flex h-full min-h-0 flex-col">
      <div class="border-b border-(--cp-workspace-border) bg-(--cp-workspace-sidebar-bg) px-4 py-1.5 text-[12px] text-(--cp-workspace-text-muted)">
        {{ filePath }}
      </div>
      <MonacoEditor
        :key="props.filePath" :files="files" :language="language" :model-value="modelValue" :path="filePath"
        :template-id="templateId" :theme="theme" :workspace-id="workspaceId" class="flex-1"
        @navigate="emits('navigate', $event)" @update:model-value="emits('update:modelValue', $event)"
      />
    </div>
  </div>
</template>
