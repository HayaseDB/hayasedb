export default defineEventHandler((event) => {
  const { apiUrl } = useRuntimeConfig(event)
  const clientIp = getRequestIP(event, { xForwardedFor: true })

  return proxyRequest(event, apiUrl + event.path, {
    headers: clientIp ? { 'x-forwarded-for': clientIp } : undefined,
  })
})
