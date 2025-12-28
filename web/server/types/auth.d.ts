export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: 'admin' | 'moderator' | 'user'
  isEmailVerified: boolean
}

export interface AuthResponse {
  token: string
  refreshToken: string
  tokenExpires: number
  user: User
}

export interface RefreshResponse {
  token: string
  refreshToken: string
  tokenExpires: number
}

export interface MessageResponse {
  message: string
}

export interface SessionResponse {
  user: User
  session: {
    id: string
    createdAt: string
    updatedAt: string
    isCurrent: boolean
  }
}
