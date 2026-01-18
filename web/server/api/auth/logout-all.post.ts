export default defineEventHandler(async (event) => {
  await authApi(event, '/auth/logout-all', { method: 'POST' }).catch(() => {})
  await clearUserSession(event)
  return { message: 'All sessions logged out' }
})
