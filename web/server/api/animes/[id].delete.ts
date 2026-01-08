export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await authFetchApi(event, `/animes/${id}`, { method: 'DELETE' })
})
