type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface AuthFetchOptions {
  method?: HttpMethod
  body?: Record<string, unknown> | FormData
  headers?: Record<string, string>
}

export function useAuthFetch() {
  const { rawToken } = useAuthState()
  const { refresh } = useAuth()

  async function authFetch<T>(url: string, options: AuthFetchOptions = {}): Promise<T> {
    const doFetch = async (): Promise<T> => {
      const response = await $fetch(url as '/api/_', {
        method: options.method,
        body: options.body,
        headers: {
          ...options.headers,
          ...(rawToken.value ? { Authorization: `Bearer ${rawToken.value}` } : {}),
        },
      })
      return response as T
    }

    try {
      return await doFetch()
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
        await refresh()
        return await doFetch()
      }
      throw error
    }
  }

  return { authFetch }
}
