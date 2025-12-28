import type { AuthTokenResponse } from '../../types/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const refreshToken = body?.refreshToken

  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      message: 'No refresh token',
    })
  }

  const response = await fetchApi<AuthTokenResponse>('/auth/refresh', {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshToken}` },
  })

  return {
    token: response.token,
    refreshToken: response.refreshToken,
  }
})
