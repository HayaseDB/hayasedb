export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await authApi<PaginatedSessionResponse>(event, '/sessions', { query })
})
