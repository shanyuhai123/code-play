export type SandboxStatus = 'creating' | 'running' | 'stopped' | 'error'

export interface SandboxConfig {
  id: string
  projectId: string
  containerId?: string
  status: SandboxStatus
  port?: number
  createdAt: Date
  updatedAt: Date
}

export interface SandboxCommand {
  command: string
  cwd?: string
}

export interface SandboxCommandResult {
  stdout: string
  stderr: string
  exitCode: number
}
