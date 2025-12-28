import { z } from 'zod'
import type { AuthResponse } from '../../types/auth'

const verifySchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
})

export default defineEventHandler(async (event) => {
  let body: z.infer<typeof verifySchema>

  try {
    body = await readValidatedBody(event, verifySchema.parse)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: {
          message: 'Invalid verification token',
          errors: error.issues.map((issue: z.core.$ZodIssue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
      })
    }
    throw error
  }

  const response = await fetchApi<AuthResponse>('/auth/verify-email', {
    method: 'POST',
    body,
  })

  return {
    token: response.token,
    refreshToken: response.refreshToken,
    user: response.user,
  }
})
