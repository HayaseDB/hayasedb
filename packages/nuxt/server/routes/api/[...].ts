import { prepareProxyHeaders, resolveBffProfile } from '../../utils/bff'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const profile = resolveBffProfile(config.bffProfile)
  const pathname = event.path.split('?')[0]!

  if (!profile.allows(event.method, pathname)) {
    if (import.meta.dev) {
      console.warn(
        `[bff] blocked ${event.method} ${pathname} (profile: ${profile.audience}): add .meta(bff('${profile.audience}')) to the contract if this is intended`,
      )
    }
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  return proxyRequest(event, config.apiUrl + event.path, {
    headers: prepareProxyHeaders(event, config.internalToken),
    fetchOptions: { redirect: 'manual' },
  })
})
