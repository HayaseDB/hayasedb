import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(50),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, registerSchema.parse)

  await fetchApi<{ message: string }>('/auth/register', {
    method: 'POST',
    body,
  })

  return { success: true }
})
