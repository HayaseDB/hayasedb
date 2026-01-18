export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return await authApi<ContributionResponse>(event, '/contributions', {
    method: 'POST',
    body,
  })
})
