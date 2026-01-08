import { z } from 'zod'

const schema = z.object({
  email: z.string().email().optional(),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)
  return await authFetchApi(event, '/users/me', {
    method: 'PATCH',
    body,
  })
})
