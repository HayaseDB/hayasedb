export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  return await authApi<GenreResponse>(event, `/genres/${id}`, {
    method: 'PATCH',
    body,
  })
})
