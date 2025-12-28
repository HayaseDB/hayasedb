export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'Authorization')

  if (!authHeader) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  await fetchApi('/auth/logout', {
    method: 'POST',
    headers: { Authorization: authHeader },
  })

  return null
})
