const TTL = 30_000

const fetchedAt = new Map<string, number>()

export function useAppSession() {
  const auth = useAuth()

  return useAsyncData(
    'app-session',
    async () => {
      const { data } = await auth.getSession({
        query: { disableCookieCache: true },
      })
      fetchedAt.set('app-session', Date.now())
      return data ?? null
    },
    {
      getCachedData(key, nuxtApp) {
        const cached = nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
        if (cached === undefined) return

        const at = fetchedAt.get(key)
        if (at !== undefined && Date.now() - at > TTL) return

        return cached
      },
    },
  )
}
