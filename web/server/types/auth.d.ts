export interface Media {
  id: string
  bucket: string
  key: string
  originalName: string
  mimeType: string
  size: number
  etag: string | null
  url: string | null
}

export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: 'administrator' | 'moderator' | 'user'
  isEmailVerified: boolean
  profilePicture: Media | null
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
