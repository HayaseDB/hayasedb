export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return await publicApi<MessageResponse>('/auth/reset-password', {
    method: 'POST',
    body,
  })
})
