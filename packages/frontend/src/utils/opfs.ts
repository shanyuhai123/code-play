import type { FileNode } from '@code-play/shared'

export class OPFSManager {
  private root: FileSystemDirectoryHandle | null = null

  async init() {
    if ('storage' in navigator && 'getDirectory' in navigator.storage) {
      this.root = await navigator.storage.getDirectory()
      return true
    }
    return false
  }

  async getProjectDirectory(projectId: string): Promise<FileSystemDirectoryHandle> {
    if (!this.root) {
      throw new Error('OPFS not initialized')
    }

    return await this.root.getDirectoryHandle(projectId, { create: true })
  }

  async writeFile(projectId: string, filePath: string, content: string) {
    const projectDir = await this.getProjectDirectory(projectId)
    const pathParts = filePath.split('/')
    const fileName = pathParts.pop()!

    // Navigate to the directory
    let currentDir = projectDir
    for (const part of pathParts) {
      if (part) {
        currentDir = await currentDir.getDirectoryHandle(part, { create: true })
      }
    }

    // Write file
    const fileHandle = await currentDir.getFileHandle(fileName, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(content)
    await writable.close()
  }

  async readFile(projectId: string, filePath: string): Promise<string> {
    const projectDir = await this.getProjectDirectory(projectId)
    const pathParts = filePath.split('/')
    const fileName = pathParts.pop()!

    // Navigate to the directory
    let currentDir = projectDir
    for (const part of pathParts) {
      if (part) {
        currentDir = await currentDir.getDirectoryHandle(part)
      }
    }

    // Read file
    const fileHandle = await currentDir.getFileHandle(fileName)
    const file = await fileHandle.getFile()
    return await file.text()
  }

  async deleteFile(projectId: string, filePath: string) {
    const projectDir = await this.getProjectDirectory(projectId)
    const pathParts = filePath.split('/')
    const fileName = pathParts.pop()!

    // Navigate to the directory
    let currentDir = projectDir
    for (const part of pathParts) {
      if (part) {
        currentDir = await currentDir.getDirectoryHandle(part)
      }
    }

    // Delete file
    await currentDir.removeEntry(fileName)
  }

  async writeFiles(projectId: string, files: FileNode[]) {
    for (const file of files) {
      if (file.type === 'file' && file.content !== undefined) {
        await this.writeFile(projectId, file.path, file.content)
      } else if (file.type === 'directory' && file.children) {
        await this.writeFiles(projectId, file.children)
      }
    }
  }

  async deleteProject(projectId: string) {
    if (!this.root) {
      throw new Error('OPFS not initialized')
    }

    try {
      await this.root.removeEntry(projectId, { recursive: true })
    } catch (error) {
      console.error('Failed to delete project from OPFS:', error)
    }
  }

  async listFiles(projectId: string, dirPath: string = ''): Promise<FileNode[]> {
    const projectDir = await this.getProjectDirectory(projectId)

    let currentDir = projectDir
    if (dirPath) {
      const pathParts = dirPath.split('/').filter(Boolean)
      for (const part of pathParts) {
        currentDir = await currentDir.getDirectoryHandle(part)
      }
    }

    const files: FileNode[] = []

    for await (const entry of currentDir.values()) {
      const path = dirPath ? `${dirPath}/${entry.name}` : entry.name

      if (entry.kind === 'directory') {
        const children = await this.listFiles(projectId, path)
        files.push({
          name: entry.name,
          path,
          type: 'directory',
          children,
        })
      } else {
        const fileHandle = entry as FileSystemFileHandle
        const file = await fileHandle.getFile()
        const content = await file.text()
        files.push({
          name: entry.name,
          path,
          type: 'file',
          content,
        })
      }
    }

    return files
  }
}

export const opfs = new OPFSManager()
