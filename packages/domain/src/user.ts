export interface User {
  /**
   * 用户 ID
   * @description 用户主键。
   */
  id: string
  /**
   * GitHub ID
   * @description GitHub OAuth 返回的唯一用户标识。
   */
  githubId: string
  /**
   * 用户名
   * @description 展示给前端的 GitHub 用户名。
   */
  username: string
  /**
   * 邮箱
   * @description 用户邮箱，未授权时可能为空。
   */
  email?: string
  /**
   * 头像地址
   * @description 用户头像 URL。
   */
  avatarUrl?: string
  /**
   * 创建时间
   * @description 用户记录创建时间。
   */
  createdAt: Date
  /**
   * 更新时间
   * @description 用户记录最后更新时间。
   */
  updatedAt: Date
}

export interface AuthToken {
  /**
   * 访问令牌
   * @description 当前登录态使用的 access token。
   */
  accessToken: string
  /**
   * 刷新令牌
   * @description 用于续期访问令牌，部分场景可能不存在。
   */
  refreshToken?: string
  /**
   * 过期秒数
   * @description 访问令牌有效期，单位为秒。
   */
  expiresIn: number
}

export interface AuthUser {
  /**
   * 用户
   * @description 已认证的用户信息。
   */
  user: User
  /**
   * 令牌
   * @description 当前登录态对应的令牌数据。
   */
  token: AuthToken
}
