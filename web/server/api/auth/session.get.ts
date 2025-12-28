import type { MeResponse } from '../../types/auth'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'Authorization')

  if (!authHeader) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const response = await fetchApi<MeResponse>('/auth/me', {
    headers: { Authorization: authHeader },
  })

  return response.user
})
