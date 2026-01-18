import type { UserResponse } from './users'

declare module '#auth-utils' {
  type User = UserResponse
  interface UserSession {
    loggedInAt: number
  }
  interface SecureSessionData {
    accessToken: string
    refreshToken: string
    tokenExpires: number
  }
}

export {}
