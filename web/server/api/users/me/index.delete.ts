export default defineEventHandler(async (event): Promise<MessageResponse> => {
  const body = await readBody(event)

  await authApi<MessageResponse>(event, '/users/me', { method: 'DELETE', body })
  await clearUserSession(event)

  return { message: 'Account deleted successfully' }
})
