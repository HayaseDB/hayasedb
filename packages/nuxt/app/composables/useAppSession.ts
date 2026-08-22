const KEY = 'app-session'
const TTL = 30_000

const fetchedAt = new Map<string, number>()

export function invalidateAppSessionCache(): void {
  fetchedAt.delete(KEY)
}

export function useAppSession() {
  const api = useApiClient()

  return useAsyncData(
    KEY,
    async () => {
      const session = await api.auth
        .getSession({ disableCookieCache: true })
        .catch(() => null)
      if (import.meta.client) fetchedAt.set(KEY, Date.now())
      return session ?? null
    },
    {
      getCachedData(key, nuxtApp) {
        if (import.meta.server) return

        const cached = nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
        if (cached === undefined) return

        const at = fetchedAt.get(key)
        if (at === undefined) {
          if (!nuxtApp.isHydrating) return
          fetchedAt.set(key, Date.now())
          return cached
        }

        if (Date.now() - at > TTL) return

        return cached
      },
    },
  )
}
