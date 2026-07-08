import { createApiClient } from '../utils/orpc'

export default defineNuxtPlugin(() => {
  const api = createApiClient(window.location.origin)

  return { provide: { api } }
})
