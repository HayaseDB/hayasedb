export async function useApiKeys() {
  const api = useApiClient()

  const { data, status, refresh } = await useAsyncData('api-keys', () =>
    api.auth.apiKey.list(),
  )

  const keys = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.meta.total ?? 0)
  const pending = computed(() => status.value === 'pending')

  return { keys, total, pending, refresh }
}
