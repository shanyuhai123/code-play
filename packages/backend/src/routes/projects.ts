import type { FastifyPluginAsync } from 'fastify'
import type { ApiResponse, CreateProjectRequest, CreateProjectResponse, UpdateProjectRequest } from '@code-play/shared'
import axios from 'axios'
import { prisma } from '../config/database'
import { config } from '../config/env'

export const projectRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all projects for current user
  fastify.get('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).id

      const projects = await prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      })

      const response: ApiResponse = {
        success: true,
        data: projects,
      }
      return response
    } catch (error) {
      fastify.log.error('Get projects error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get projects' },
      })
    }
  })

  // Get project by id
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = (request.user as any).id

      const project = await prisma.project.findFirst({
        where: { id, userId },
      })

      if (!project) {
        return reply.status(404).send({
          success: false,
          error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
        })
      }

      const response: ApiResponse = {
        success: true,
        data: project,
      }
      return response
    } catch (error) {
      fastify.log.error('Get project error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get project' },
      })
    }
  })

  // Create new project
  fastify.post('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const body = request.body as CreateProjectRequest
      const userId = (request.user as any).id

      // Create project in database
      const project = await prisma.project.create({
        data: {
          name: body.name,
          templateId: body.templateId,
          userId,
        },
      })

      // Request sandbox manager to create project files
      try {
        const sandboxResponse = await axios.post(
          `${config.sandboxManager.url}/api/projects/create`,
          {
            projectId: project.id,
            templateId: body.templateId,
          },
          { timeout: 30000 },
        )

        const response: ApiResponse<CreateProjectResponse> = {
          success: true,
          data: {
            project,
            files: sandboxResponse.data.files || [],
          },
        }
        return response
      } catch (sandboxError) {
        // If sandbox creation fails, delete the project
        await prisma.project.delete({ where: { id: project.id } })
        throw sandboxError
      }
    } catch (error) {
      fastify.log.error('Create project error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create project' },
      })
    }
  })

  // Update project
  fastify.patch('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = request.body as UpdateProjectRequest
      const userId = (request.user as any).id

      // Check if project exists and belongs to user
      const existingProject = await prisma.project.findFirst({
        where: { id, userId },
      })

      if (!existingProject) {
        return reply.status(404).send({
          success: false,
          error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
        })
      }

      // Update project
      const project = await prisma.project.update({
        where: { id },
        data: {
          name: body.name,
        },
      })

      const response: ApiResponse = {
        success: true,
        data: project,
      }
      return response
    } catch (error) {
      fastify.log.error('Update project error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update project' },
      })
    }
  })

  // Delete project
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = (request.user as any).id

      // Check if project exists and belongs to user
      const existingProject = await prisma.project.findFirst({
        where: { id, userId },
      })

      if (!existingProject) {
        return reply.status(404).send({
          success: false,
          error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
        })
      }

      // Delete project (cascades to sandboxes)
      await prisma.project.delete({ where: { id } })

      const response: ApiResponse = {
        success: true,
      }
      return response
    } catch (error) {
      fastify.log.error('Delete project error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete project' },
      })
    }
  })
}
