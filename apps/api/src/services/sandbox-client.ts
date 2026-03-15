import type { ApiResponse } from '@code-play/contracts'
import type { FileNode } from '@code-play/domain'
import type { FlatProjectFile } from './project-files.js'
import { config } from '../config.js'

export async function sandboxFetch<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${config.sandbox.baseUrl}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  return res.json() as Promise<ApiResponse<T>>
}

export async function createProject(templateId: string, projectName: string) {
  return sandboxFetch<{ files: FileNode[], output: string }>(
    '/projects/create',
    {
      method: 'POST',
      body: JSON.stringify({ templateId, projectName }),
    },
  )
}

export async function createSession(projectId: string, files: FlatProjectFile[]) {
  return sandboxFetch<{ sessionId: string, containerId: string, previewPort: number | null }>(
    '/sessions',
    {
      method: 'POST',
      body: JSON.stringify({ projectId, files }),
    },
  )
}

export async function getSession(sessionId: string) {
  return sandboxFetch<{ sessionId: string, containerId: string, previewPort: number | null }>(`/sessions/${sessionId}`)
}

export async function destroySession(sessionId: string) {
  return sandboxFetch(`/sessions/${sessionId}`, { method: 'DELETE' })
}

export async function writeSessionFile(sessionId: string, path: string, content: string) {
  return sandboxFetch<{ path: string }>(`/sessions/${sessionId}/files`, {
    method: 'PATCH',
    body: JSON.stringify({ path, content }),
  })
}
