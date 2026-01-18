export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return await authApi<GenreResponse>(event, '/genres', {
    method: 'POST',
    body,
  })
})
