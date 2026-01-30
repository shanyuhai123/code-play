import { ref } from 'vue'
import type { User } from '@code-play/shared'
import { authApi } from '../api/auth'

const user = ref<User | null>(null)
const isAuthenticated = ref(false)
const isLoading = ref(false)

export function useAuth() {
  const loadUser = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      isAuthenticated.value = false
      user.value = null
      return
    }

    try {
      isLoading.value = true
      const userData = await authApi.getCurrentUser()
      user.value = userData
      isAuthenticated.value = true
    } catch (error) {
      console.error('Failed to load user:', error)
      localStorage.removeItem('auth_token')
      isAuthenticated.value = false
      user.value = null
    } finally {
      isLoading.value = false
    }
  }

  const login = (token: string) => {
    localStorage.setItem('auth_token', token)
    loadUser()
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('auth_token')
      user.value = null
      isAuthenticated.value = false
    }
  }

  const loginWithGithub = () => {
    window.location.href = authApi.getGithubLoginUrl()
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    loadUser,
    login,
    logout,
    loginWithGithub,
  }
}
