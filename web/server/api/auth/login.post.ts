import { z } from 'zod'
import type { AuthResponse } from '../../types/auth'

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)

  const response = await fetchApi<AuthResponse>('/auth/login', {
    method: 'POST',
    body,
  })

  return {
    token: response.token,
    refreshToken: response.refreshToken,
    user: response.user,
  }
})
