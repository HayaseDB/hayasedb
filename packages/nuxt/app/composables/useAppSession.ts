export function useAppSession() {
  return useAsyncData('app-session', async () => {
    const { data } = await useAuth().getSession({
      query: { disableCookieCache: true },
    })
    return data ?? null
  })
}
