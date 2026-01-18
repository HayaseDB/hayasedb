export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await authApi<Paginated<ContributionResponse>>(event, '/contributions/queue', { query })
})
