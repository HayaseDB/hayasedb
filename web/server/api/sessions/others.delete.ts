export default defineEventHandler(async (event) => {
  return await authFetchApi(event, '/sessions/others', { method: 'DELETE' })
})
