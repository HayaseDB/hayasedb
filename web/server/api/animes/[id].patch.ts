export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  return await authApi<AnimeResponse>(event, `/animes/${id}`, {
    method: 'PATCH',
    body,
  })
})
