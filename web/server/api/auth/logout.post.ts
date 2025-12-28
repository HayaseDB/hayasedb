export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'Authorization')

  if (authHeader) {
    await fetchApi('/auth/logout', {
      method: 'POST',
      headers: { Authorization: authHeader },
    }).catch(() => {})
  }

  return { success: true }
})
