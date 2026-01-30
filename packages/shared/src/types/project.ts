export interface Template {
  id: string
  name: string
  icon: string
  description: string
}

export interface Project {
  id: string
  name: string
  templateId: string
  createdAt: Date
  updatedAt: Date
  userId?: string
}

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  content?: string
  children?: FileNode[]
}
