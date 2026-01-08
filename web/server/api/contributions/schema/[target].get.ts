export default defineEventHandler(async (event) => {
  const target = getRouterParam(event, 'target')
  return await fetchApi<Record<string, unknown>>(`/contributions/schema/${target}`)
})
