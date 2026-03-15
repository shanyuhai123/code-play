import type * as Monaco from 'monaco-editor'
import type { MonacoFile } from '../types'
import { getLanguageFromFilename } from '../utils/language'
import { createModelUri } from '../utils/uri'

export function syncMonacoFiles(monaco: typeof Monaco, workspaceId: string, files: MonacoFile[]) {
  const trackedUris = new Set<string>()

  for (const file of files) {
    const uri = createModelUri(monaco, workspaceId, file.path)
    trackedUris.add(uri.toString())

    const language = getLanguageFromFilename(file.path)
    const existing = monaco.editor.getModel(uri)

    if (!existing) {
      monaco.editor.createModel(file.content, language, uri)
      continue
    }

    if (existing.getValue() !== file.content) {
      existing.setValue(file.content)
    }

    if (existing.getLanguageId() !== language) {
      monaco.editor.setModelLanguage(existing, language)
    }
  }

  for (const model of monaco.editor.getModels()) {
    const uri = model.uri.toString()
    if (uri.startsWith(`file:///code-play/${workspaceId}/`) && !trackedUris.has(uri)) {
      model.dispose()
    }
  }
}

export function disposeWorkspaceModels(monaco: typeof Monaco, workspaceId: string) {
  for (const model of monaco.editor.getModels()) {
    if (model.uri.toString().startsWith(`file:///code-play/${workspaceId}/`)) {
      model.dispose()
    }
  }
}
