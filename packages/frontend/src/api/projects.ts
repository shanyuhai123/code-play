import type { Project, CreateProjectRequest, CreateProjectResponse, UpdateProjectRequest } from '@code-play/shared'
import { api } from './client'

export const projectApi = {
  // Get all projects
  async getProjects() {
    const response = await api.get<{ success: boolean; data: Project[] }>('/projects')
    return response.data.data
  },

  // Get project by id
  async getProject(id: string) {
    const response = await api.get<{ success: boolean; data: Project }>(`/projects/${id}`)
    return response.data.data
  },

  // Create project
  async createProject(data: CreateProjectRequest) {
    const response = await api.post<{ success: boolean; data: CreateProjectResponse }>('/projects', data)
    return response.data.data
  },

  // Update project
  async updateProject(id: string, data: UpdateProjectRequest) {
    const response = await api.patch<{ success: boolean; data: Project }>(`/projects/${id}`, data)
    return response.data.data
  },

  // Delete project
  async deleteProject(id: string) {
    await api.delete(`/projects/${id}`)
  },
}
