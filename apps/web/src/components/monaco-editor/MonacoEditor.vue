<script setup lang="ts">
import type * as Monaco from 'monaco-editor'
import type { MonacoEditorProps } from './types'
import { ref } from 'vue'
import { useMonacoEditor } from './composables/useMonacoEditor'

const props = withDefaults(defineProps<MonacoEditorProps>(), {
  files: () => [],
  language: 'plaintext',
  readonly: false,
  theme: 'vs-dark',
  workspaceId: 'default',
  options: () => ({}),
})

const emits = defineEmits<{
  'blur': []
  'focus': []
  'navigate': [path: string]
  'ready': [editor: Monaco.editor.IStandaloneCodeEditor]
  'update:modelValue': [value: string]
}>()

const containerRef = ref<HTMLElement | null>(null)

const { focus, getEditor, layout } = useMonacoEditor({
  containerRef,
  props,
  emit: {
    blur: () => emits('blur'),
    focus: () => emits('focus'),
    navigate: path => emits('navigate', path),
    ready: editor => emits('ready', editor),
    updateModelValue: value => emits('update:modelValue', value),
  },
})

defineExpose({
  focus,
  getEditor,
  layout,
})
</script>

<template>
  <div ref="containerRef" class="h-full min-h-0 w-full" />
</template>
