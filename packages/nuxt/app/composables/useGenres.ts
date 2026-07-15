export function useGenres() {
  const api = useApiClient()
  const { data, status, refresh } = useAsyncData('genres', () =>
    api.genre.list(),
  )

  const genres = computed(() => data.value?.items ?? [])
  const pending = computed(() => status.value === 'pending')

  return { genres, pending, refresh }
}
