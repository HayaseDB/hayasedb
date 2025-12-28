import type { RefreshResponse } from '../../types/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.refreshToken) {
    throw createError({ statusCode: 401, message: 'Refresh token required' })
  }

  const token = body.refreshToken as string
  const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`

  return await fetchApi<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    headers: { Authorization: authHeader },
  })
})
