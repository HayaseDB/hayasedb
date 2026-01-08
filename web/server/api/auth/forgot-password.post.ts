import { z } from 'zod'
import type { MessageResponse } from '../../types/auth'

const schema = z.object({
  email: z.string().email(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)
  return await fetchApi<MessageResponse>('/auth/forgot-password', {
    method: 'POST',
    body,
  })
})
