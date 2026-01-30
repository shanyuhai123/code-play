import type { FastifyPluginAsync } from 'fastify'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readdir, readFile, rm } from 'node:fs/promises'
import tar from 'tar-stream'

const execAsync = promisify(exec)

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  content?: string
  children?: FileNode[]
}

async function readDirectoryRecursive(dirPath: string, basePath: string = ''): Promise<FileNode[]> {
  const entries = await readdir(dirPath, { withFileTypes: true })
  const files: FileNode[] = []

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name)
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name

    // Skip node_modules and other large directories
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
      continue
    }

    if (entry.isDirectory()) {
      const children = await readDirectoryRecursive(fullPath, relativePath)
      files.push({
        name: entry.name,
        path: relativePath,
        type: 'directory',
        children,
      })
    } else {
      const content = await readFile(fullPath, 'utf-8')
      files.push({
        name: entry.name,
        path: relativePath,
        type: 'file',
        content,
      })
    }
  }

  return files
}

export const projectRoutes: FastifyPluginAsync = async (fastify) => {
  // Create project from template
  fastify.post('/create', async (request, reply) => {
    try {
      const { projectId, templateId } = request.body as { projectId: string; templateId: string }

      // Create temporary directory
      const tempDir = join(tmpdir(), `code-play-${projectId}`)

      // Create project using pnpm create vite
      const templateMap: Record<string, string> = {
        'vanilla': 'vanilla-ts',
        'vue': 'vue-ts',
        'react': 'react-ts',
        'preact': 'preact-ts',
        'lit': 'lit-ts',
        'svelte': 'svelte-ts',
        'solid': 'solid-ts',
        'qwik': 'qwik-ts',
      }

      const template = templateMap[templateId] || 'vanilla-ts'

      await execAsync(`pnpm create vite ${tempDir} --template ${template}`, {
        cwd: tmpdir(),
      })

      // Read all files from the created project
      const files = await readDirectoryRecursive(tempDir)

      // Clean up temporary directory
      await rm(tempDir, { recursive: true, force: true })

      return {
        success: true,
        files,
      }
    } catch (error) {
      fastify.log.error('Create project error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create project' },
      })
    }
  })
}
