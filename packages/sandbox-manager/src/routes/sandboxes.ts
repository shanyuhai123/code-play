import type { FastifyPluginAsync } from 'fastify'
import { docker } from '../docker/client'
import { config } from '../config/env'
import { redis } from '../redis/client'

interface CreateSandboxRequest {
  sandboxId: string
  projectId: string
}

interface ExecuteCommandRequest {
  command: string
  cwd?: string
}

export const sandboxRoutes: FastifyPluginAsync = async (fastify) => {
  // Create sandbox container
  fastify.post('/create', async (request, reply) => {
    try {
      const { sandboxId, projectId } = request.body as CreateSandboxRequest

      // Create container
      const container = await docker.createContainer({
        Image: config.docker.sandboxImage,
        name: `sandbox-${sandboxId}`,
        Env: [
          `PROJECT_ID=${projectId}`,
          `SANDBOX_ID=${sandboxId}`,
        ],
        HostConfig: {
          NetworkMode: config.docker.networkName,
          Memory: 512 * 1024 * 1024, // 512MB
          MemorySwap: 512 * 1024 * 1024,
          CpuQuota: 50000, // 50% of one CPU
          AutoRemove: false,
        },
        WorkingDir: '/workspace',
      })

      // Start container
      await container.start()

      // Get container info
      const containerInfo = await container.inspect()
      const containerId = containerInfo.Id

      // Store container info in Redis
      await redis.set(
        `sandbox:${sandboxId}`,
        JSON.stringify({
          containerId,
          projectId,
          createdAt: new Date().toISOString(),
        }),
        { EX: 3600 * 24 }, // 24 hours
      )

      return {
        success: true,
        containerId,
        port: null, // We'll implement port mapping later if needed
      }
    } catch (error) {
      fastify.log.error('Create sandbox error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create sandbox' },
      })
    }
  })

  // Execute command in container
  fastify.post('/:containerId/execute', async (request, reply) => {
    try {
      const { containerId } = request.params as { containerId: string }
      const { command, cwd } = request.body as ExecuteCommandRequest

      const container = docker.getContainer(containerId)

      // Create exec instance
      const exec = await container.exec({
        Cmd: ['/bin/sh', '-c', command],
        AttachStdout: true,
        AttachStderr: true,
        WorkingDir: cwd || '/workspace',
      })

      // Start exec and get output
      const stream = await exec.start({ Detach: false })

      let stdout = ''
      let stderr = ''

      stream.on('data', (chunk: Buffer) => {
        const data = chunk.toString()
        // Docker multiplexes stdout/stderr, first byte indicates stream type
        if (chunk[0] === 1) {
          stdout += data.slice(8)
        } else if (chunk[0] === 2) {
          stderr += data.slice(8)
        }
      })

      await new Promise((resolve) => {
        stream.on('end', resolve)
      })

      const inspectResult = await exec.inspect()

      return {
        success: true,
        stdout,
        stderr,
        exitCode: inspectResult.ExitCode || 0,
      }
    } catch (error) {
      fastify.log.error('Execute command error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to execute command' },
      })
    }
  })

  // Stop container
  fastify.post('/:containerId/stop', async (request, reply) => {
    try {
      const { containerId } = request.params as { containerId: string }

      const container = docker.getContainer(containerId)
      await container.stop({ t: 10 })

      return {
        success: true,
      }
    } catch (error) {
      fastify.log.error('Stop sandbox error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to stop sandbox' },
      })
    }
  })

  // Delete container
  fastify.delete('/:containerId', async (request, reply) => {
    try {
      const { containerId } = request.params as { containerId: string }

      const container = docker.getContainer(containerId)

      // Stop if running
      try {
        await container.stop({ t: 5 })
      } catch {
        // Container might already be stopped
      }

      // Remove container
      await container.remove({ force: true })

      return {
        success: true,
      }
    } catch (error) {
      fastify.log.error('Delete sandbox error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete sandbox' },
      })
    }
  })

  // Terminal WebSocket endpoint (placeholder)
  fastify.post('/:containerId/terminal', async (request, reply) => {
    try {
      const { containerId } = request.params as { containerId: string }
      const { data } = request.body as { data: string }

      // This is a simplified version - in production, you'd want a proper WebSocket connection
      // For now, we'll just execute the command
      const container = docker.getContainer(containerId)

      const exec = await container.exec({
        Cmd: ['/bin/sh', '-c', data],
        AttachStdout: true,
        AttachStderr: true,
      })

      await exec.start({ Detach: true })

      return {
        success: true,
      }
    } catch (error) {
      fastify.log.error('Terminal error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to send terminal command' },
      })
    }
  })
}
