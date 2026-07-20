const STRIPPED_HEADERS = new Set(['x-forwarded-host', 'x-forwarded-proto'])

export default defineEventHandler((event) => {
  const { apiUrl } = useRuntimeConfig(event)
  const clientIp = getRequestIP(event, { xForwardedFor: true })

  const proxyHeaders = getProxyRequestHeaders(event) as Record<
    string,
    string | undefined
  >

  const headers: Record<string, string> = {}
  for (const [name, value] of Object.entries(proxyHeaders)) {
    if (value !== undefined && !STRIPPED_HEADERS.has(name.toLowerCase())) {
      headers[name] = value
    }
  }
  if (clientIp) headers['x-forwarded-for'] = clientIp

  return proxyRequest(event, apiUrl + event.path, {
    fetchOptions: { headers },
  })
})
