import type { FastifyPluginAsync } from 'fastify'
import type { ApiResponse, CreateSandboxRequest, ExecuteCommandRequest } from '@code-play/shared'
import axios from 'axios'
import { prisma } from '../config/database'
import { config } from '../config/env'

export const sandboxRoutes: FastifyPluginAsync = async (fastify) => {
  // Create sandbox
  fastify.post('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const body = request.body as CreateSandboxRequest
      const userId = (request.user as any).id

      // Verify project belongs to user
      const project = await prisma.project.findFirst({
        where: { id: body.projectId, userId },
      })

      if (!project) {
        return reply.status(404).send({
          success: false,
          error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
        })
      }

      // Create sandbox record
      const sandbox = await prisma.sandbox.create({
        data: {
          projectId: body.projectId,
          status: 'creating',
        },
      })

      // Request sandbox manager to create container
      try {
        const sandboxResponse = await axios.post(
          `${config.sandboxManager.url}/api/sandboxes/create`,
          {
            sandboxId: sandbox.id,
            projectId: body.projectId,
          },
          { timeout: 60000 },
        )

        // Update sandbox with container info
        const updatedSandbox = await prisma.sandbox.update({
          where: { id: sandbox.id },
          data: {
            containerId: sandboxResponse.data.containerId,
            port: sandboxResponse.data.port,
            status: 'running',
          },
        })

        const response: ApiResponse = {
          success: true,
          data: updatedSandbox,
        }
        return response
      } catch (sandboxError) {
        // Update status to failed
        await prisma.sandbox.update({
          where: { id: sandbox.id },
          data: { status: 'failed' },
        })
        throw sandboxError
      }
    } catch (error) {
      fastify.log.error('Create sandbox error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create sandbox' },
      })
    }
  })

  // Get sandbox by id
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = (request.user as any).id

      const sandbox = await prisma.sandbox.findFirst({
        where: {
          id,
          project: { userId },
        },
        include: { project: true },
      })

      if (!sandbox) {
        return reply.status(404).send({
          success: false,
          error: { code: 'SANDBOX_NOT_FOUND', message: 'Sandbox not found' },
        })
      }

      const response: ApiResponse = {
        success: true,
        data: sandbox,
      }
      return response
    } catch (error) {
      fastify.log.error('Get sandbox error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get sandbox' },
      })
    }
  })

  // Execute command in sandbox
  fastify.post('/:id/execute', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = request.body as ExecuteCommandRequest
      const userId = (request.user as any).id

      // Verify sandbox belongs to user
      const sandbox = await prisma.sandbox.findFirst({
        where: {
          id,
          project: { userId },
        },
      })

      if (!sandbox) {
        return reply.status(404).send({
          success: false,
          error: { code: 'SANDBOX_NOT_FOUND', message: 'Sandbox not found' },
        })
      }

      if (sandbox.status !== 'running') {
        return reply.status(400).send({
          success: false,
          error: { code: 'SANDBOX_NOT_RUNNING', message: 'Sandbox is not running' },
        })
      }

      // Forward to sandbox manager
      const executeResponse = await axios.post(
        `${config.sandboxManager.url}/api/sandboxes/${sandbox.containerId}/execute`,
        {
          command: body.command,
          cwd: body.cwd,
        },
        { timeout: 30000 },
      )

      const response: ApiResponse = {
        success: true,
        data: executeResponse.data,
      }
      return response
    } catch (error) {
      fastify.log.error('Execute command error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to execute command' },
      })
    }
  })

  // Stop sandbox
  fastify.post('/:id/stop', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = (request.user as any).id

      const sandbox = await prisma.sandbox.findFirst({
        where: {
          id,
          project: { userId },
        },
      })

      if (!sandbox) {
        return reply.status(404).send({
          success: false,
          error: { code: 'SANDBOX_NOT_FOUND', message: 'Sandbox not found' },
        })
      }

      if (sandbox.containerId) {
        await axios.post(
          `${config.sandboxManager.url}/api/sandboxes/${sandbox.containerId}/stop`,
          {},
          { timeout: 10000 },
        )
      }

      await prisma.sandbox.update({
        where: { id },
        data: { status: 'stopped' },
      })

      const response: ApiResponse = {
        success: true,
      }
      return response
    } catch (error) {
      fastify.log.error('Stop sandbox error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to stop sandbox' },
      })
    }
  })

  // Delete sandbox
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = (request.user as any).id

      const sandbox = await prisma.sandbox.findFirst({
        where: {
          id,
          project: { userId },
        },
      })

      if (!sandbox) {
        return reply.status(404).send({
          success: false,
          error: { code: 'SANDBOX_NOT_FOUND', message: 'Sandbox not found' },
        })
      }

      if (sandbox.containerId) {
        await axios.delete(
          `${config.sandboxManager.url}/api/sandboxes/${sandbox.containerId}`,
          { timeout: 10000 },
        )
      }

      await prisma.sandbox.delete({ where: { id } })

      const response: ApiResponse = {
        success: true,
      }
      return response
    } catch (error) {
      fastify.log.error('Delete sandbox error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete sandbox' },
      })
    }
  })

  // WebSocket for terminal
  fastify.get('/:id/terminal', { websocket: true }, async (connection, request) => {
    try {
      const { id } = request.params as { id: string }

      // Verify authentication
      const token = request.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        connection.socket.close()
        return
      }

      try {
        await fastify.jwt.verify(token)
      } catch {
        connection.socket.close()
        return
      }

      const sandbox = await prisma.sandbox.findUnique({
        where: { id },
      })

      if (!sandbox || !sandbox.containerId) {
        connection.socket.close()
        return
      }

      // Forward WebSocket connection to sandbox manager
      connection.socket.on('message', async (message) => {
        try {
          await axios.post(
            `${config.sandboxManager.url}/api/sandboxes/${sandbox.containerId}/terminal`,
            { data: message.toString() },
          )
        } catch (error) {
          fastify.log.error('Terminal message error:', error)
        }
      })

      connection.socket.on('close', () => {
        // Cleanup
      })
    } catch (error) {
      fastify.log.error('Terminal connection error:', error)
      connection.socket.close()
    }
  })
}
