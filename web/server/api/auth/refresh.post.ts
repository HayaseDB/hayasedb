import type { AuthTokenResponse } from '../../types/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const refreshToken = body?.refreshToken

  if (!refreshToken || typeof refreshToken !== 'string') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: {
        message: 'No refresh token provided',
        code: 'NO_REFRESH_TOKEN',
      },
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
