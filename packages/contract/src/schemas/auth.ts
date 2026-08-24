import * as z from 'zod'
import { paginationInputSchema, queryBooleanSchema } from './common'

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 128

export const EMAIL_NOT_VERIFIED_MESSAGE = 'Email address is not verified'

export const socialProviders = ['github', 'discord'] as const
export type SocialProvider = (typeof socialProviders)[number]

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

export const setPasswordSchema = z
  .object({
    newPassword: newPasswordSchema,
    confirmPassword: requiredString('Password confirmation'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const userRoles = ['user', 'admin'] as const
export type UserRole = (typeof userRoles)[number]

export const adminCreateUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: newPasswordSchema,
  role: z.enum(userRoles),
})

export const adminUpdateUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
})

export const adminSetPasswordSchema = setPasswordSchema

export const adminBanUserSchema = z.object({
  reason: requiredString('Reason')
    .trim()
    .min(1, 'Reason is required')
    .max(200, 'Reason must be at most 200 characters'),
  expiresIn: z.number().int().positive().optional(),
})

export type LoginSchema = z.output<typeof loginSchema>
export type RegisterSchema = z.output<typeof registerSchema>
export type ForgotPasswordSchema = z.output<typeof forgotPasswordSchema>
export type ResetPasswordSchema = z.output<typeof resetPasswordSchema>
export type UpdateProfileSchema = z.output<typeof updateProfileSchema>
export type ChangeEmailSchema = z.output<typeof changeEmailSchema>
export type ChangePasswordSchema = z.output<typeof changePasswordSchema>
export type SetPasswordSchema = z.output<typeof setPasswordSchema>
export type AdminCreateUserSchema = z.output<typeof adminCreateUserSchema>
export type AdminUpdateUserSchema = z.output<typeof adminUpdateUserSchema>
export type AdminSetPasswordSchema = z.output<typeof adminSetPasswordSchema>
export type AdminBanUserSchema = z.output<typeof adminBanUserSchema>

export const userIdSchema = z.string().min(1)

export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullish(),
  role: z.string().nullish(),
  banned: z.boolean().nullish(),
  banReason: z.string().nullish(),
  banExpires: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const sessionSchema = z.object({
  id: z.string(),
  token: z.string(),
  userId: z.string(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  impersonatedBy: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date(),
})

export const sessionEnvelopeSchema = z.object({
  session: sessionSchema,
  user: sessionUserSchema,
})

export const adminUserEnvelopeSchema = z.object({ user: sessionUserSchema })

export const accountRowSchema = z.object({
  id: z.string(),
  userId: z.string(),
  providerId: z.string(),
  accountId: z.string(),
  scopes: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
})

const apiKeyFields = {
  id: z.string(),
  name: z.string().nullable(),
  start: z.string().nullable(),
  prefix: z.string().nullable(),
  referenceId: z.string(),
  enabled: z.boolean(),
  rateLimitEnabled: z.boolean(),
  requestCount: z.number(),
  remaining: z.number().nullable(),
  lastRequest: z.date().nullable(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
}

export const apiKeySchema = z.object(apiKeyFields)

export const apiKeyWithSecretSchema = z.object({
  ...apiKeyFields,
  key: z.string(),
})

export type SessionUser = z.output<typeof sessionUserSchema>
export type SessionRow = z.output<typeof sessionSchema>
export type SessionEnvelope = z.output<typeof sessionEnvelopeSchema>
export type AccountRow = z.output<typeof accountRowSchema>
export type ApiKey = z.output<typeof apiKeySchema>
export type ApiKeyWithSecret = z.output<typeof apiKeyWithSecretSchema>

export const adminUserSearchFields = ['name', 'email'] as const
export const adminUserSortFields = ['name', 'createdAt'] as const
export const sortDirections = ['asc', 'desc'] as const

export const adminListUsersInputSchema = paginationInputSchema
  .extend({
    searchValue: z.string().trim().min(1).optional(),
    searchField: z.enum(adminUserSearchFields).optional(),
    searchOperator: z.enum(['contains', 'starts_with', 'ends_with']).optional(),
    filterField: z.enum(['role', 'banned']).optional(),
    filterValue: z.union([z.enum(userRoles), queryBooleanSchema]).optional(),
    filterOperator: z.enum(['eq', 'ne']).optional(),
    sortBy: z.enum(adminUserSortFields).optional(),
    sortDirection: z.enum(sortDirections).optional(),
  })
  .refine(
    ({ filterField, filterValue }) =>
      filterField === undefined
        ? filterValue === undefined
        : filterField === 'banned'
          ? typeof filterValue === 'boolean'
          : typeof filterValue === 'string',
    {
      message: 'filterValue does not match filterField',
      path: ['filterValue'],
    },
  )

export const adminListUsersOutputSchema = z.object({
  users: z.array(sessionUserSchema),
  total: z.number(),
})

export type AdminListUsersInput = z.output<typeof adminListUsersInputSchema>
export type AdminListUsersOutput = z.output<typeof adminListUsersOutputSchema>

export const socialSignInInputSchema = z.object({
  provider: z.enum(socialProviders),
  callbackURL: z.string().optional(),
  errorCallbackURL: z.string().optional(),
})

export const socialSignInOutputSchema = z.object({
  url: z.string().nullish(),
  redirect: z.boolean(),
})

export const oauthCallbackParamsSchema = z.object({ id: z.string().min(1) })

export const oauthCallbackQuerySchema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
  state: z.string().optional(),
  device_id: z.string().optional(),
  user: z.string().optional(),
})

export const oauthRedirectOutputSchema = z.object({
  headers: z.object({ location: z.string() }),
})

export const successSchema = z.object({ success: z.boolean() })

export type SocialSignInInput = z.output<typeof socialSignInInputSchema>
export type SocialSignInOutput = z.output<typeof socialSignInOutputSchema>
export type OAuthCallbackQuery = z.output<typeof oauthCallbackQuerySchema>
