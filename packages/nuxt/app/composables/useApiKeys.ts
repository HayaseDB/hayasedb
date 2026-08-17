export async function useApiKeys() {
  const auth = useAuth()

  const { data, status, refresh } = await useAsyncData('api-keys', async () => {
    const { data: keys, error } = await auth.apiKey.list()
    if (error) {
      throw createError({
        statusCode: error.status ?? 500,
        statusMessage: error.message ?? 'Could not load API keys.',
      })
    }
    return keys?.apiKeys ?? []
  })

  const keys = computed(() => data.value ?? [])
  const pending = computed(() => status.value === 'pending')

  return { keys, pending, refresh }
}
