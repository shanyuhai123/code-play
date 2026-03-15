import type * as Monaco from 'monaco-editor'

const vueModuleDeclaration = `
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, any>
  export default component
}
`

const viteClientDeclaration = `
interface ImportMetaEnv {
  /**
   * 基础路径
   * @description Vite 注入的静态资源基础路径。
   */
  readonly BASE_URL: string
  /**
   * 模式
   * @description 当前构建模式名称。
   */
  readonly MODE: string
  /**
   * 开发环境
   * @description 当前是否为开发模式。
   */
  readonly DEV: boolean
  /**
   * 生产环境
   * @description 当前是否为生产模式。
   */
  readonly PROD: boolean
  /**
   * SSR
   * @description 当前是否运行在 SSR 环境。
   */
  readonly SSR: boolean
  /**
   * 自定义变量
   * @description 其余通过 Vite 注入的环境变量。
   */
  readonly [key: string]: string | boolean | undefined
}

interface ImportMeta {
  /**
   * 环境变量
   * @description import.meta 上暴露的环境变量集合。
   */
  readonly env: ImportMetaEnv
}
`

let configured = false
let extraLibDisposables: Monaco.IDisposable[] = []

interface LanguageServiceDefaults {
  /**
   * 添加额外库
   * @description 向 Monaco 语言服务注册额外声明文件。
   */
  addExtraLib: (content: string, filePath?: string) => Monaco.IDisposable
  /**
   * 设置编译选项
   * @description 配置 TS/JS 语言服务使用的编译参数。
   */
  setCompilerOptions: (options: Record<string, unknown>) => void
  /**
   * 预同步模型
   * @description 控制是否急切同步编辑器模型到语言服务。
   */
  setEagerModelSync: (value: boolean) => void
}

interface TypeScriptApi {
  /**
   * JS 默认项
   * @description JavaScript 语言服务默认配置。
   */
  javascriptDefaults: LanguageServiceDefaults
  /**
   * TS 默认项
   * @description TypeScript 语言服务默认配置。
   */
  typescriptDefaults: LanguageServiceDefaults
  /**
   * JSX 枚举
   * @description JSX 输出模式枚举。
   */
  JsxEmit: {
    /**
     * Preserve
     * @description 保留 JSX 语法不转换。
     */
    Preserve: number
    /**
     * React JSX
     * @description 按 React JSX 运行时输出。
     */
    ReactJSX: number
  }
  /**
   * 模块枚举
   * @description TS 模块类型枚举。
   */
  ModuleKind: {
    /**
     * ESNext
     * @description 使用 ESNext 模块系统。
     */
    ESNext: number
  }
  /**
   * 模块解析枚举
   * @description TS 模块解析策略枚举。
   */
  ModuleResolutionKind: {
    /**
     * NodeJs
     * @description 使用 Node 风格模块解析。
     */
    NodeJs: number
  }
  /**
   * 目标枚举
   * @description TS 编译目标版本枚举。
   */
  ScriptTarget: {
    /**
     * ES2020
     * @description 使用 ES2020 作为编译目标。
     */
    ES2020: number
  }
}

function getTypeScriptApi(monaco: typeof Monaco) {
  return monaco.languages.typescript as unknown as TypeScriptApi
}

function getCompilerOptions(monaco: typeof Monaco, templateId?: string) {
  const typescript = getTypeScriptApi(monaco)

  return {
    allowJs: true,
    allowNonTsExtensions: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    jsx: templateId === 'react'
      ? typescript.JsxEmit.ReactJSX
      : typescript.JsxEmit.Preserve,
    module: typescript.ModuleKind.ESNext,
    moduleResolution: typescript.ModuleResolutionKind.NodeJs,
    resolveJsonModule: true,
    target: typescript.ScriptTarget.ES2020,
  }
}

export function configureTypeScript(monaco: typeof Monaco, templateId?: string) {
  const typescript = getTypeScriptApi(monaco)
  const compilerOptions = getCompilerOptions(monaco, templateId)

  typescript.typescriptDefaults.setCompilerOptions(compilerOptions)
  typescript.javascriptDefaults.setCompilerOptions({
    ...compilerOptions,
    checkJs: true,
  })

  if (configured) {
    return
  }

  typescript.typescriptDefaults.setEagerModelSync(true)
  typescript.javascriptDefaults.setEagerModelSync(true)

  extraLibDisposables.forEach(disposable => disposable.dispose())
  extraLibDisposables = [
    typescript.typescriptDefaults.addExtraLib(vueModuleDeclaration, 'file:///code-play/types/vue-shim.d.ts'),
    typescript.typescriptDefaults.addExtraLib(viteClientDeclaration, 'file:///code-play/types/vite-client.d.ts'),
    typescript.javascriptDefaults.addExtraLib(vueModuleDeclaration, 'file:///code-play/types/vue-shim.d.ts'),
    typescript.javascriptDefaults.addExtraLib(viteClientDeclaration, 'file:///code-play/types/vite-client.d.ts'),
  ]

  configured = true
}
