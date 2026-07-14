import { getRequestIP } from 'h3'
import { createApiClient } from '../utils/orpc'

export default defineNuxtPlugin(() => {
  const { apiUrl } = useRuntimeConfig()
  const event = useRequestEvent()

  const headers: Record<string, string> = { ...useRequestHeaders(['cookie']) }
  const clientIp = event && getRequestIP(event, { xForwardedFor: true })
  if (clientIp) headers['x-forwarded-for'] = clientIp

  return {
    provide: {
      api: createApiClient({ origin: apiUrl, headers: () => headers }),
    },
  }
})
