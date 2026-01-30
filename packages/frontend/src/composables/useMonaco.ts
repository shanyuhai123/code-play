import type { Ref } from 'vue'
import * as monaco from 'monaco-editor'
import { ref, onMounted, onUnmounted } from 'vue'

export function useMonacoEditor(containerRef: Ref<HTMLElement | null>) {
  const editor = ref<monaco.editor.IStandaloneCodeEditor | null>(null)
  const currentFile = ref<string>('')
  const currentContent = ref<string>('')

  onMounted(() => {
    if (!containerRef.value) return

    editor.value = monaco.editor.create(containerRef.value, {
      value: '',
      language: 'typescript',
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      tabSize: 2,
    })

    // Listen to content changes
    editor.value.onDidChangeModelContent(() => {
      if (editor.value) {
        currentContent.value = editor.value.getValue()
      }
    })
  })

  onUnmounted(() => {
    editor.value?.dispose()
  })

  function setContent(content: string, language: string = 'typescript') {
    if (!editor.value) return

    const model = editor.value.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, language)
      editor.value.setValue(content)
    }
  }

  function getContent(): string {
    return editor.value?.getValue() || ''
  }

  function setLanguage(language: string) {
    if (!editor.value) return

    const model = editor.value.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, language)
    }
  }

  return {
    editor,
    currentFile,
    currentContent,
    setContent,
    getContent,
    setLanguage,
  }
}

export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'vue': 'vue',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'sh': 'shell',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'sql': 'sql',
  }
  return languageMap[ext || ''] || 'plaintext'
}
