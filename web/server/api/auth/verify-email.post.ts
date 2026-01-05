import { z } from 'zod'
import type { AuthResponse } from '../../types/auth'
import { getClientHeaders } from '../../utils/api'

const schema = z.object({
  token: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)

  return await fetchApi<AuthResponse>('/auth/verify-email', {
    method: 'POST',
    body,
    headers: getClientHeaders(event),
  })
})
