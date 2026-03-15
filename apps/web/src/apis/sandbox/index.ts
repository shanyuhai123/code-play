import type { SandboxSession, StartSandboxSessionResponse } from './typing'
import { axios } from '@/utils/axios'

export * from './typing'

export function getSandboxSession(projectId: string): Promise<SandboxSession> {
  return axios.request({
    method: 'get',
    url: `/sandbox/${projectId}`,
  })
}

export function startSandboxSession(projectId: string): Promise<StartSandboxSessionResponse> {
  return axios.request({
    method: 'post',
    url: `/sandbox/${projectId}/start`,
  })
}
