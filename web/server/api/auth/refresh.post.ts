import type { RefreshResponse } from '../../types/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.refreshToken) {
    throw createError({ statusCode: 401, message: 'Refresh token required' })
  }

  return await fetchApi<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    headers: { Authorization: `Bearer ${body.refreshToken}` },
  })
})
