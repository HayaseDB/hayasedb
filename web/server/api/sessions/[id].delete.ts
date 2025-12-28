export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await authFetchApi(event, `/sessions/${id}`, { method: 'DELETE' })
})
