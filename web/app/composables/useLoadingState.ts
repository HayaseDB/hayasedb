export function useLoadingState() {
  const isLoading = ref(false)

  async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
    isLoading.value = true
    try {
      return await fn()
    } finally {
      isLoading.value = false
    }
  }

  return { isLoading, withLoading }
}
