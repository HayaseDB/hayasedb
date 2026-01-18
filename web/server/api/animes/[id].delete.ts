export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await authApi(event, `/animes/${id}`, { method: 'DELETE' })
})
