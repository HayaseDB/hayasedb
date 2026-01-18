export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await authApi(event, `/contributions/${id}`, { method: 'DELETE' })
})
