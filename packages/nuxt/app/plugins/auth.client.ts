import { createAppAuthClient } from '@hayasedb/auth/client'
import type { AppAuthClient } from '@hayasedb/auth'
import { handleUnauthenticated } from '../utils/sessionInvalidation'

export default defineNuxtPlugin(() => {
  const auth: AppAuthClient = createAppAuthClient({
    onUnauthorized: () => void handleUnauthenticated(auth),
  })

  return {
    provide: { auth },
  }
})
