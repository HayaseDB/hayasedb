export default defineEventHandler(async (event) => {
  const response = await authFetchApi<Record<string, unknown>>(event, '/auth/me')
  return (response.user as Record<string, unknown>) || response
})
