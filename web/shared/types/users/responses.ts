import type { MediaResponse } from '../media'
import type { Role } from './enums'

export interface UserResponse {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: Role
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
  profilePicture: MediaResponse | null
}
