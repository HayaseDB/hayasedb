export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const response = await publicApi<AuthResponse>('/auth/login', {
    method: 'POST',
    body,
    headers: event.headers,
  })

  await setUserSession(event, {
    user: response.user,
    loggedInAt: Date.now(),
    secure: {
      accessToken: response.token,
      refreshToken: response.refreshToken,
      tokenExpires: response.tokenExpires,
    },
  })

  return { user: response.user }
})
