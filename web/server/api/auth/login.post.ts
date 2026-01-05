import { z } from 'zod'
import type { AuthResponse } from '../../types/auth'
import { getClientHeaders } from '../../utils/api'

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)

  return await fetchApi<AuthResponse>('/auth/login', {
    method: 'POST',
    body,
    headers: getClientHeaders(event),
  })
})
