import type * as Monaco from 'monaco-editor'
import { conf as htmlConf, language as htmlLanguage } from 'monaco-editor/esm/vs/basic-languages/html/html.js'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

interface MonacoEnvironment {
  /**
   * 获取 Worker
   * @description 按语言标签返回对应的 Monaco Worker 实例。
   */
  getWorker: (_workerId: string, label: string) => Worker
}

let monacoPromise: Promise<typeof Monaco> | null = null

function configureEnvironment() {
  const target = globalThis as typeof globalThis & { MonacoEnvironment?: MonacoEnvironment }

  if (target.MonacoEnvironment) {
    return
  }

  target.MonacoEnvironment = {
    getWorker(_, label) {
      switch (label) {
        case 'json':
          return new JsonWorker()
        case 'css':
        case 'scss':
        case 'less':
          return new CssWorker()
        case 'html':
        case 'vue':
        case 'handlebars':
        case 'razor':
          return new HtmlWorker()
        case 'typescript':
        case 'javascript':
          return new TsWorker()
        default:
          return new EditorWorker()
      }
    },
  }
}

function registerLanguages(monaco: typeof Monaco) {
  if (monaco.languages.getLanguages().some(language => language.id === 'vue')) {
    return
  }

  monaco.languages.register({
    id: 'vue',
    extensions: ['.vue'],
    aliases: ['Vue', 'vue'],
    mimetypes: ['text/x-vue'],
  })
  monaco.languages.setLanguageConfiguration('vue', htmlConf)
  monaco.languages.setMonarchTokensProvider('vue', {
    ...htmlLanguage,
    tokenPostfix: '.vue',
  })
}

export function loadMonaco() {
  monacoPromise ??= import('monaco-editor').then((monaco) => {
    configureEnvironment()
    registerLanguages(monaco)
    return monaco
  })

  return monacoPromise
}
