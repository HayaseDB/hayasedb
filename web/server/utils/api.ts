export async function fetchApi<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    body?: Record<string, unknown>
    headers?: Record<string, string>
  } = {},
): Promise<T> {
  const config = useRuntimeConfig()
  const url = `${config.apiUrl}${path}`

  const response = await $fetch(url, {
    method: options.method || 'GET',
    body: options.body,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  return response as T
}
