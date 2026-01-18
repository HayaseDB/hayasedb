export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await publicApi<Paginated<GenreResponse>>('/genres', { query })
})
