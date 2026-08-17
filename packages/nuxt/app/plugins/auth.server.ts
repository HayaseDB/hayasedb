import { createAppAuthClient } from '@hayasedb/auth/client'

export default defineNuxtPlugin(() => {
  const { apiUrl } = useRuntimeConfig()
  const headers = useInternalApiHeaders()

  return {
    provide: {
      auth: createAppAuthClient({ baseURL: apiUrl, fetchOptions: { headers } }),
    },
  }
})
