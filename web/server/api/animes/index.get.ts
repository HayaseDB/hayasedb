export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await publicApi<Paginated<AnimeResponse>>('/animes', { query })
})
