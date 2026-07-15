import { createApiClient } from '../utils/orpc'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      api: createApiClient({ origin: window.location.origin }),
    },
  }
})
