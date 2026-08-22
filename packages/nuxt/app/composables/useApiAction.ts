import type { CallApiOptions } from '../utils/callApi'

export function useApiAction() {
  const loading = ref(false)

  async function run<T>(
    fn: () => Promise<T>,
    options?: CallApiOptions,
  ): Promise<T | null> {
    loading.value = true
    try {
      return await callApi(fn, options)
    } finally {
      loading.value = false
    }
  }

  return { loading, run }
}
