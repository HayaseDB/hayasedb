import { z } from 'zod'
import type { AuthResponse } from '../../types/auth'

const verifySchema = z.object({
  token: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, verifySchema.parse)

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
