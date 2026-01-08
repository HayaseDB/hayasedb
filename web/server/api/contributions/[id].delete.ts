export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await authFetchApi(event, `/contributions/${id}`, { method: 'DELETE' })
})
