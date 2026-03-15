import type * as Monaco from 'monaco-editor'
import type { ref } from 'vue'
import type { MonacoEditorProps } from '../types'
import { computed, nextTick, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { CODE_FONT_STACK, FONT_READY_EVENT } from '@/setup/fonts'
import { loadMonaco } from '../helpers/loader'
import { bindImportNavigation } from '../helpers/navigation'
import { configureTypeScript } from '../helpers/typescript'
import { disposeWorkspaceModels, syncMonacoFiles } from '../helpers/workspace'
import { createModelUri } from '../utils/uri'

interface UseMonacoEditorOptions {
  /**
   * 容器引用
   * @description 编辑器挂载节点的 DOM 引用。
   */
  containerRef: ReturnType<typeof ref<HTMLElement | null>>
  /**
   * 属性
   * @description MonacoEditor 组件传入的 props。
   */
  props: Readonly<MonacoEditorProps>
  /**
   * 事件
   * @description composable 向外分发的组件事件集合。
   */
  emit: {
    /**
     * 失焦
     * @description 编辑器文本区域失焦时触发。
     */
    blur: () => void
    /**
     * 聚焦
     * @description 编辑器文本区域聚焦时触发。
     */
    focus: () => void
    /**
     * 就绪
     * @description Monaco 实例完成创建后触发。
     */
    ready: (editor: Monaco.editor.IStandaloneCodeEditor) => void
    /**
     * 更新值
     * @description 编辑器文本变化时向外同步内容。
     */
    updateModelValue: (value: string) => void
    /**
     * 导航
     * @description 点击可解析导入路径时触发导航。
     */
    navigate: (path: string) => void
  }
}

export function useMonacoEditor(options: UseMonacoEditorOptions) {
  const { containerRef, emit, props } = options

  const editor = shallowRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const model = shallowRef<Monaco.editor.ITextModel | null>(null)
  const monacoRef = shallowRef<typeof Monaco | null>(null)
  const files = computed(() => props.files ?? [])

  const disposables: Monaco.IDisposable[] = []
  let syncingFromOutside = false
  let initializing = true

  const editorOptions = computed<Monaco.editor.IStandaloneEditorConstructionOptions>(() => ({
    automaticLayout: true,
    fontFamily: CODE_FONT_STACK,
    fontSize: 14,
    minimap: { enabled: true },
    model: model.value ?? undefined,
    multiCursorModifier: 'alt',
    readOnly: props.readonly,
    scrollBeyondLastLine: false,
    tabSize: 2,
    theme: props.theme,
    ...props.options,
  }))

  async function syncModels() {
    const monaco = monacoRef.value
    if (!monaco || !props.workspaceId || !props.path) {
      return
    }

    syncMonacoFiles(monaco, props.workspaceId, files.value)

    const uri = createModelUri(monaco, props.workspaceId, props.path)
    model.value = monaco.editor.getModel(uri)
    if (!model.value) {
      model.value = monaco.editor.createModel(props.modelValue, props.language, uri)
    }

    if (model.value.getValue() !== props.modelValue) {
      syncingFromOutside = true
      model.value.setValue(props.modelValue)
      syncingFromOutside = false
    }

    if (props.language && model.value.getLanguageId() !== props.language) {
      monaco.editor.setModelLanguage(model.value, props.language)
    }

    editor.value?.setModel(model.value)
  }

  async function createEditor() {
    if (!containerRef.value || !props.workspaceId || !props.path) {
      return
    }

    const monaco = await loadMonaco()
    monacoRef.value = monaco
    configureTypeScript(monaco, props.templateId)
    await syncModels()

    if (!model.value) {
      return
    }

    editor.value = monaco.editor.create(containerRef.value, {
      ...editorOptions.value,
      model: model.value,
    })

    disposables.push(
      editor.value.onDidChangeModelContent(() => {
        if (initializing || syncingFromOutside || !editor.value) {
          return
        }

        emit.updateModelValue(editor.value.getValue())
      }),
      editor.value.onDidBlurEditorText(() => emit.blur()),
      editor.value.onDidFocusEditorText(() => emit.focus()),
      bindImportNavigation(editor.value, () => props.path ?? '', () => files.value, path => emit.navigate(path)),
    )

    emit.ready(editor.value)
    await nextTick()
    editor.value.layout()
    initializing = false
  }

  function focus() {
    editor.value?.focus()
  }

  function layout() {
    editor.value?.layout()
  }

  function getEditor() {
    return editor.value
  }

  function handleFontsReady() {
    const monaco = monacoRef.value
    if (!editor.value || !monaco) {
      return
    }

    editor.value.updateOptions({ fontFamily: CODE_FONT_STACK })
    monaco.editor.remeasureFonts()
    editor.value.layout()
  }

  watch(() => props.modelValue, (value) => {
    if (!editor.value || !model.value || value === editor.value.getValue()) {
      return
    }

    syncingFromOutside = true
    model.value.setValue(value)
    syncingFromOutside = false
  })

  watch(() => props.language, async (language) => {
    const monaco = monacoRef.value
    if (!monaco || !model.value || !language) {
      return
    }

    monaco.editor.setModelLanguage(model.value, language)
  })

  watch(() => props.readonly, (readonly) => {
    editor.value?.updateOptions({ readOnly: readonly })
  })

  watch(() => props.theme, async (theme) => {
    const monaco = monacoRef.value
    if (!monaco || !theme) {
      return
    }

    monaco.editor.setTheme(theme)
  })

  watch(() => props.options, (options) => {
    editor.value?.updateOptions(options ?? {})
  }, { deep: true })

  watch(
    () => [props.path, props.workspaceId, props.templateId] as const,
    async () => {
      const monaco = monacoRef.value
      if (!editor.value || !monaco || !props.workspaceId || !props.path) {
        return
      }

      configureTypeScript(monaco, props.templateId)
      await syncModels()
      await nextTick()
      editor.value.layout()
    },
  )

  watch(files, async () => {
    if (!monacoRef.value || !props.workspaceId) {
      return
    }

    await syncModels()
  }, { deep: true })

  onMounted(() => {
    window.addEventListener(FONT_READY_EVENT, handleFontsReady)
    void createEditor()
  })

  onUnmounted(() => {
    window.removeEventListener(FONT_READY_EVENT, handleFontsReady)
    initializing = true
    disposables.forEach(disposable => disposable.dispose())
    editor.value?.dispose()
    if (monacoRef.value && props.workspaceId) {
      disposeWorkspaceModels(monacoRef.value, props.workspaceId)
    }
    editor.value = null
    model.value = null
  })

  return {
    focus,
    getEditor,
    layout,
  }
}
