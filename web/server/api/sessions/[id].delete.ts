export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await authApi(event, `/sessions/${id}`, { method: 'DELETE' })
})
