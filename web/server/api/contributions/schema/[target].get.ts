export default defineEventHandler(async (event) => {
  const target = getRouterParam(event, 'target')
  return await publicApi<Record<string, unknown>>(`/contributions/schema/${target}`)
})
