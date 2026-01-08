export default defineEventHandler(async (event) => {
  await authFetchApi(event, '/auth/logout-all', { method: 'POST' })
  return null
})
