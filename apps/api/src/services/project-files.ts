import type { FileNode } from '@code-play/domain'

export interface FlatProjectFile {
  /**
   * 路径
   * @description 扁平化后的文件相对路径。
   */
  path: string
  /**
   * 内容
   * @description 文件完整文本内容。
   */
  content: string
}

export function flattenFileTree(nodes: FileNode[]): FlatProjectFile[] {
  const files: FlatProjectFile[] = []

  for (const node of nodes) {
    if (node.type === 'file' && node.content !== undefined) {
      files.push({
        path: normalizeFilePath(node.path),
        content: node.content,
      })
      continue
    }

    if (node.children) {
      files.push(...flattenFileTree(node.children))
    }
  }

  return files
}

export function buildFileTree(files: FlatProjectFile[]): FileNode[] {
  const root: FileNode[] = []

  for (const file of files) {
    const parts = normalizeFilePath(file.path).split('/').filter(Boolean)
    let current = root

    for (const [index, name] of parts.entries()) {
      const isFile = index === parts.length - 1
      const path = parts.slice(0, index + 1).join('/')
      let existing = current.find(node => node.path === path)

      if (!existing) {
        existing = {
          name,
          path,
          type: isFile ? 'file' : 'directory',
          ...(isFile ? { content: file.content } : { children: [] }),
        }
        current.push(existing)
      }

      if (isFile) {
        existing.content = file.content
        continue
      }

      if (!existing.children) {
        existing.children = []
      }

      current = existing.children
    }
  }

  sortFileTree(root)
  return root
}

export function normalizeFilePath(path: string) {
  return path.replace(/^\/+/, '').replace(/\\/g, '/')
}

function sortFileTree(nodes: FileNode[]) {
  nodes.sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === 'directory' ? -1 : 1
    }

    return left.name.localeCompare(right.name)
  })

  for (const node of nodes) {
    if (node.children) {
      sortFileTree(node.children)
    }
  }
}
