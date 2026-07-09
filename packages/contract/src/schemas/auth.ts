import * as z from 'zod'

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 128

export type SocialProvider = 'github' | 'discord'

export interface SignInEmailInput {
  email: string
  password: string
}

export interface SignUpEmailInput {
  name: string
  email: string
  password: string
}

export interface AccountUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  role?: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

export interface AccountSessionRow {
  id: string
  token: string
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string | Date
  expiresAt: string | Date
}

export interface AccountLinkedRow {
  providerId: string
  accountId: string
}

function requiredString(label: string) {
  return z.string({
    error: (issue) =>
      issue.input === undefined
        ? `${label} is required`
        : `${label} must be text`,
  })
}

export const emailSchema = requiredString('Email')
  .trim()
  .pipe(z.email('Enter a valid email address'))

export const currentPasswordSchema = requiredString('Password').min(
  1,
  'Password is required',
)

export const newPasswordSchema = requiredString('Password').min(
  PASSWORD_MIN,
  `Password must be at least ${PASSWORD_MIN} characters`,
)

export const nameSchema = requiredString('Name')
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters')

export const loginSchema = z.object({
  email: emailSchema,
  password: currentPasswordSchema,
})

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: newPasswordSchema,
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: requiredString('Password confirmation'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const updateProfileSchema = z.object({
  name: nameSchema,
})

export const changeEmailSchema = z.object({
  email: emailSchema,
})

export const changePasswordSchema = z
  .object({
    currentPassword: currentPasswordSchema,
    newPassword: newPasswordSchema,
    confirmPassword: requiredString('Password confirmation'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type LoginSchema = z.output<typeof loginSchema>
export type RegisterSchema = z.output<typeof registerSchema>
export type ForgotPasswordSchema = z.output<typeof forgotPasswordSchema>
export type ResetPasswordSchema = z.output<typeof resetPasswordSchema>
export type UpdateProfileSchema = z.output<typeof updateProfileSchema>
export type ChangeEmailSchema = z.output<typeof changeEmailSchema>
export type ChangePasswordSchema = z.output<typeof changePasswordSchema>
