export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await authFetchApi(event, `/genres/${id}`, { method: 'DELETE' })
})
