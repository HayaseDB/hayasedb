import type { MessageResponse } from '../common'
import type { UserResponse } from '../users'

export interface AuthResponse {
  token: string
  refreshToken: string
  tokenExpires: number
  user: UserResponse
}

export interface RefreshResponse {
  token: string
  refreshToken: string
  tokenExpires: number
}

export interface SessionInfo {
  id: string
  createdAt: string
  updatedAt: string
  isCurrent: boolean
}

export interface CurrentUserResponse {
  user: UserResponse
  session: SessionInfo
}

export type VerifyEmailResponse = MessageResponse
