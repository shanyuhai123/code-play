import type { FileNode } from '@code-play/domain'
import type { Buffer } from 'node:buffer'
import type { Readable } from 'node:stream'
import { extract } from 'tar-stream'

export async function extractFiles(archiveStream: Readable, basePath: string): Promise<FileNode[]> {
  const files: { path: string, content: string }[] = []

  return new Promise((resolve, reject) => {
    const parser = extract()

    parser.on('entry', (header, stream, next) => {
      let relativePath = header.name
      if (relativePath.startsWith(basePath)) {
        relativePath = relativePath.slice(basePath.length)
      }
      // 去掉 tar 中常见的前导路径前缀
      const firstSlash = relativePath.indexOf('/')
      if (firstSlash >= 0) {
        relativePath = relativePath.slice(firstSlash + 1)
      }

      if (!relativePath || relativePath.includes('node_modules/')) {
        stream.resume()
        next()
        return
      }

      if (header.type === 'file') {
        const chunks: Buffer[] = []
        stream.on('data', (chunk: Buffer) => chunks.push(chunk))
        stream.on('end', () => {
          files.push({
            path: relativePath,
            content: Buffer.concat(chunks).toString('utf-8'),
          })
          next()
        })
      }
      else {
        stream.resume()
        next()
      }
    })

    parser.on('finish', () => {
      resolve(buildFileTree(files))
    })

    parser.on('error', reject)

    archiveStream.pipe(parser)
  })
}

function buildFileTree(files: { path: string, content: string }[]): FileNode[] {
  const root: FileNode[] = []

  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean)
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      const isFile = i === parts.length - 1
      const currentPath = parts.slice(0, i + 1).join('/')

      let existing = current.find(n => n.name === name)

      if (!existing) {
        existing = {
          name,
          path: currentPath,
          type: isFile ? 'file' : 'directory',
          ...(isFile ? { content: file.content } : { children: [] }),
        }
        current.push(existing)
      }

      if (!isFile) {
        if (!existing.children) {
          existing.children = []
        }
        current = existing.children
      }
    }
  }

  sortFileTree(root)
  return root
}

function sortFileTree(nodes: FileNode[]) {
  nodes.sort((a, b) => {
    if (a.type !== b.type)
      return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  for (const node of nodes) {
    if (node.children)
      sortFileTree(node.children)
  }
}
