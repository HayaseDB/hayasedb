export async function useApiKeys() {
  const api = useApiClient()

  const { data, status, refresh } = await useAsyncData('api-keys', () =>
    api.auth.apiKey.list(),
  )

  const keys = computed(() => data.value ?? [])
  const pending = computed(() => status.value === 'pending')

  return { keys, pending, refresh }
}
