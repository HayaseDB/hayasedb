import { z } from 'zod'

const registerSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
})

export default defineEventHandler(async (event) => {
  let body: z.infer<typeof registerSchema>

  try {
    body = await readValidatedBody(event, registerSchema.parse)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: {
          message: 'Invalid registration data',
          errors: error.issues.map((issue: z.core.$ZodIssue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
      })
    }
    throw error
  }

  await fetchApi<{ message: string }>('/auth/register', {
    method: 'POST',
    body,
  })

  return { success: true }
})
