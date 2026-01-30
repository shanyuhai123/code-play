import type { CreateSandboxRequest, ExecuteCommandRequest } from '@code-play/shared'
import { api } from './client'

export interface Sandbox {
  id: string
  projectId: string
  containerId: string | null
  status: string
  port: number | null
  createdAt: Date
  updatedAt: Date
}

export const sandboxApi = {
  // Create sandbox
  async createSandbox(data: CreateSandboxRequest) {
    const response = await api.post<{ success: boolean; data: Sandbox }>('/sandboxes', data)
    return response.data.data
  },

  // Get sandbox
  async getSandbox(id: string) {
    const response = await api.get<{ success: boolean; data: Sandbox }>(`/sandboxes/${id}`)
    return response.data.data
  },

  // Execute command
  async executeCommand(id: string, data: ExecuteCommandRequest) {
    const response = await api.post<{ success: boolean; data: { stdout: string; stderr: string; exitCode: number } }>(
      `/sandboxes/${id}/execute`,
      data,
    )
    return response.data.data
  },

  // Stop sandbox
  async stopSandbox(id: string) {
    await api.post(`/sandboxes/${id}/stop`)
  },

  // Delete sandbox
  async deleteSandbox(id: string) {
    await api.delete(`/sandboxes/${id}`)
  },

  // Get WebSocket URL for terminal
  getTerminalWsUrl(id: string) {
    const baseUrl = api.defaults.baseURL?.replace('http', 'ws') || 'ws://localhost:3000/api'
    return `${baseUrl}/sandboxes/${id}/terminal`
  },
}
