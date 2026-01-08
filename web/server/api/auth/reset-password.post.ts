import { z } from 'zod'
import type { MessageResponse } from '../../types/auth'

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)
  return await fetchApi<MessageResponse>('/auth/reset-password', {
    method: 'POST',
    body,
  })
})
