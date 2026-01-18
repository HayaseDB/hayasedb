export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await authApi<ContributionResponse>(event, `/contributions/${id}`)
})
