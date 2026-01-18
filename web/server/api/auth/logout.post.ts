export default defineEventHandler(async (event) => {
  await authApi(event, '/auth/logout', { method: 'POST' }).catch(() => {})
  await clearUserSession(event)
  return { message: 'Logged out' }
})
