import { z, type ZodIssue } from 'zod'
import type { AuthResponse } from '../../types/auth'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export default defineEventHandler(async (event) => {
  let body: z.infer<typeof loginSchema>

  try {
    body = await readValidatedBody(event, loginSchema.parse)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: {
          message: 'Invalid login credentials format',
          errors: error.issues.map((issue: ZodIssue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
      })
    }
    throw error
  }

  const response = await fetchApi<AuthResponse>('/auth/login', {
    method: 'POST',
    body,
  })

  return {
    token: response.token,
    refreshToken: response.refreshToken,
    user: response.user,
  }
})
