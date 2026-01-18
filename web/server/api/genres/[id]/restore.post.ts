export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await authApi<GenreResponse>(event, `/genres/${id}/restore`, { method: 'POST' })
})
