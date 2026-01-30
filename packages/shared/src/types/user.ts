export interface User {
  id: string
  githubId: string
  username: string
  email?: string
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface AuthToken {
  accessToken: string
  refreshToken?: string
  expiresIn: number
}

export interface AuthUser {
  user: User
  token: AuthToken
}
