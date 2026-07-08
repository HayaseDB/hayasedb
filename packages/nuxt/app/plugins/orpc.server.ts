import type { ApiClient } from '../utils/orpc'
import { createApiClient } from '../utils/orpc'

declare module '#app' {
  interface NuxtApp {
    $api: ApiClient
  }
}

export default defineNuxtPlugin(() => {
  const cookie = useRequestHeaders(['cookie']).cookie
  const api = createApiClient(
    useRequestURL().origin,
    cookie ? { cookie } : undefined,
  )

  return { provide: { api } }
})
