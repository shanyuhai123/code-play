import type { FastifyPluginAsync } from 'fastify'
import type { ApiResponse, AuthUser } from '@code-play/shared'
import axios from 'axios'
import { prisma } from '../config/database'
import { config } from '../config/env'

interface GitHubUser {
  id: number
  login: string
  email: string | null
  avatar_url: string
}

interface GitHubTokenResponse {
  access_token: string
  token_type: string
  scope: string
}

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // GitHub OAuth login
  fastify.get('/github', async (request, reply) => {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${config.github.clientId}&redirect_uri=${config.github.callbackUrl}&scope=user:email`
    reply.redirect(githubAuthUrl)
  })

  // GitHub OAuth callback
  fastify.get('/github/callback', async (request, reply) => {
    try {
      const { code } = request.query as { code: string }

      if (!code) {
        return reply.status(400).send({
          success: false,
          error: { code: 'MISSING_CODE', message: 'Authorization code is required' },
        })
      }

      // Exchange code for access token
      const tokenResponse = await axios.post<GitHubTokenResponse>(
        'https://github.com/login/oauth/access_token',
        {
          client_id: config.github.clientId,
          client_secret: config.github.clientSecret,
          code,
        },
        {
          headers: { Accept: 'application/json' },
        },
      )

      const { access_token } = tokenResponse.data

      // Get user info from GitHub
      const userResponse = await axios.get<GitHubUser>('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${access_token}` },
      })

      const githubUser = userResponse.data

      // Find or create user in database
      let user = await prisma.user.findUnique({
        where: { githubId: String(githubUser.id) },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            githubId: String(githubUser.id),
            username: githubUser.login,
            email: githubUser.email,
            avatarUrl: githubUser.avatar_url,
          },
        })
      } else {
        // Update user info
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            username: githubUser.login,
            email: githubUser.email,
            avatarUrl: githubUser.avatar_url,
          },
        })
      }

      // Generate JWT token
      const token = fastify.jwt.sign({
        id: user.id,
        githubId: user.githubId,
        username: user.username,
      })

      // Redirect to frontend with token
      const frontendUrl = config.cors.origin
      reply.redirect(`${frontendUrl}/auth/callback?token=${token}`)
    } catch (error) {
      fastify.log.error('GitHub OAuth error:', error)
      const frontendUrl = config.cors.origin
      reply.redirect(`${frontendUrl}/auth/callback?error=auth_failed`)
    }
  })

  // Get current user
  fastify.get('/me', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).id

      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        })
      }

      const response: ApiResponse = {
        success: true,
        data: {
          id: user.id,
          githubId: user.githubId,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      }
      return response
    } catch (error) {
      fastify.log.error('Get user error:', error)
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get user' },
      })
    }
  })

  // Logout
  fastify.post('/logout', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    // JWT is stateless, so we just return success
    // Client should remove the token from storage
    const response: ApiResponse = {
      success: true,
    }
    return response
  })
}
