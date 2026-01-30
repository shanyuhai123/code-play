export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface CreateProjectRequest {
  name: string
  templateId: string
}

export interface CreateProjectResponse {
  project: import('./project').Project
  files: import('./project').FileNode[]
}

export interface UpdateProjectRequest {
  name?: string
}

export interface CreateSandboxRequest {
  projectId: string
}

export interface ExecuteCommandRequest {
  sandboxId: string
  command: string
  cwd?: string
}
