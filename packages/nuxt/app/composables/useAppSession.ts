export function useAppSession() {
  const auth = useAuth()

  return useAsyncData('app-session', async () => {
    const { data } = await auth.getSession({
      query: { disableCookieCache: true },
    })
    return data ?? null
  })
}
