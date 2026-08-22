import { createApiClient } from '../utils/orpc'
import { notifyRateLimited } from '../utils/rateLimitNotice'
import { handleUnauthenticated } from '../utils/sessionInvalidation'

export default defineNuxtPlugin(() => {
  const api = createApiClient({
    origin: window.location.origin,
    onUnauthorized: () => void handleUnauthenticated(),
    onRateLimited: notifyRateLimited,
  })

  return {
    provide: { api },
  }
})
