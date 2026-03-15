import type {
  CreateProjectRequest,
  CreateProjectResponse,
  GetProjectResponse,
  Project,
  ProjectSummary,
  SyncProjectFileRequest,
  SyncProjectFileResponse,
  UpdateProjectRequest,
} from './typing'
import { axios } from '@/utils/axios'

export * from './typing'

export function listProjects(): Promise<ProjectSummary[]> {
  return axios.request({
    method: 'get',
    url: '/projects',
  })
}

export function getProject(projectId: string): Promise<GetProjectResponse> {
  return axios.request({
    method: 'get',
    url: `/projects/${projectId}`,
  })
}

export function createProject(payload: CreateProjectRequest): Promise<CreateProjectResponse> {
  return axios.request({
    method: 'post',
    url: '/projects',
    data: payload,
  })
}

export function renameProject(projectId: string, payload: UpdateProjectRequest): Promise<Project> {
  return axios.request({
    method: 'patch',
    url: `/projects/${projectId}`,
    data: payload,
  })
}

export function deleteProject(projectId: string): Promise<null> {
  return axios.request({
    method: 'delete',
    url: `/projects/${projectId}`,
  })
}

export function syncProjectFile(projectId: string, payload: SyncProjectFileRequest): Promise<SyncProjectFileResponse> {
  return axios.request({
    method: 'patch',
    url: `/projects/${projectId}/files`,
    data: payload,
  })
}
