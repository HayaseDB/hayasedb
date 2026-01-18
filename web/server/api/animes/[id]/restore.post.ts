export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await authApi<AnimeResponse>(event, `/animes/${id}/restore`, { method: 'POST' })
})
