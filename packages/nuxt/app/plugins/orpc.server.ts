import { createApiClient } from '../utils/orpc'

export default defineNuxtPlugin(() => {
  const { apiUrl } = useRuntimeConfig()
  const headers = useInternalApiHeaders()

  return {
    provide: {
      api: createApiClient({ origin: apiUrl, headers: () => headers }),
    },
  }
})
