import { z } from 'zod'
import type { MessageResponse } from '../../types/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(50),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)

  return await fetchApi<MessageResponse>('/auth/register', {
    method: 'POST',
    body,
  })
})
