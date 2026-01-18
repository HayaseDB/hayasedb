export default defineEventHandler(async (event) => {
  return await authApi<RevokedSessionsResponse>(event, '/sessions/others', { method: 'DELETE' })
})
