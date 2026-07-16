import { createApiClient } from '../utils/orpc'
import { handleUnauthenticated } from '../utils/sessionInvalidation'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      api: createApiClient({
        origin: window.location.origin,
        onUnauthorized: () => void handleUnauthenticated(useNuxtApp().$auth),
      }),
    },
  }
})
