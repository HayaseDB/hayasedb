export default defineEventHandler(async (event) => {
  await authFetchApi(event, '/auth/logout', { method: 'POST' })
  return null
})
