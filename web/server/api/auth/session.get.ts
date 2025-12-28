import type { SessionResponse } from '../../types/auth'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'Authorization')

  if (!authHeader) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const response = await fetchApi<SessionResponse>('/auth/me', {
    headers: { Authorization: authHeader },
  })

  return response.user
})
