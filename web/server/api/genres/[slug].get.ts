export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  return await publicApi<GenreResponse>(`/genres/${slug}`)
})
