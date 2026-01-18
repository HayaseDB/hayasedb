import type { CreateUserRequest } from '../users'

export interface LoginRequest {
  email: string
  password: string
}

export type RegisterRequest = CreateUserRequest

export interface VerifyEmailRequest {
  token: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ResendVerificationRequest {
  email: string
}
