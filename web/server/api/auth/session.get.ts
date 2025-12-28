import type { MeResponse } from '../../types/auth'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'Authorization')

  if (!authHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: {
        message: 'No authorization token provided',
        code: 'NO_AUTH_TOKEN',
      },
    })
  }

  const response = await fetchApi<MeResponse>('/auth/me', {
    headers: { Authorization: authHeader },
  })

  return response.user
})
