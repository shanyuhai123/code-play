import type { User } from '@code-play/shared'
import { api } from './client'

export interface LoginResponse {
  token: string
  user: User
}

export const authApi = {
  // Get current user
  async getCurrentUser() {
    const response = await api.get<{ success: boolean; data: User }>('/auth/me')
    return response.data.data
  },

  // Logout
  async logout() {
    await api.post('/auth/logout')
    localStorage.removeItem('auth_token')
  },

  // GitHub OAuth login
  getGithubLoginUrl() {
    return `${api.defaults.baseURL}/auth/github`
  },
}
