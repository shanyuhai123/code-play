import type * as Monaco from 'monaco-editor'
import { normalizeFilePath } from './path'

export function createWorkspaceRoot(workspaceId: string) {
  return `file:///code-play/${workspaceId}`
}

export function createModelUri(monaco: typeof Monaco, workspaceId: string, path: string) {
  return monaco.Uri.parse(`${createWorkspaceRoot(workspaceId)}/${normalizeFilePath(path)}`)
}
