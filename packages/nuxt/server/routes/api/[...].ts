export default defineEventHandler((event) => {
  const { apiUrl } = useRuntimeConfig(event)
  return proxyRequest(event, apiUrl + event.path)
})
