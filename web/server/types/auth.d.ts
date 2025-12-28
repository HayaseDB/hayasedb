export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: 'admin' | 'moderator' | 'user'
  isEmailVerified: boolean
}

export interface AuthTokenResponse {
  token: string
  refreshToken: string
  tokenExpires: number
}

export interface AuthResponse extends AuthTokenResponse {
  user: User
}

export interface MeResponse {
  user: User
}
