export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return await publicApi<MessageResponse>('/auth/forgot-password', {
    method: 'POST',
    body,
  })
})
