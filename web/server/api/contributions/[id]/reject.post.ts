export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  return await authApi<ContributionResponse>(event, `/contributions/${id}/reject`, {
    method: 'POST',
    body,
  })
})
