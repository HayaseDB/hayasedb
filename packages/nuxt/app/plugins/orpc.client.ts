import { createApiClient } from '../utils/orpc'
import { notifyRateLimited } from '../utils/rateLimitNotice'
import {
  handleUnauthenticated,
  handleUnverifiedEmail,
} from '../utils/sessionInvalidation'

export default defineNuxtPlugin(() => {
  const api = createApiClient({
    origin: window.location.origin,
    onUnauthorized: () => void handleUnauthenticated(),
    onUnverifiedEmail: () => void handleUnverifiedEmail(),
    onRateLimited: notifyRateLimited,
  })

  return {
    provide: { api },
  }
})
