import document from '@hayasedb/contract/openapi.json'

export default defineEventHandler((event) => {
  const { apiPublicUrl } = useRuntimeConfig(event).public

  setResponseHeader(event, 'content-type', 'application/json')

  return {
    ...document,
    servers: [{ url: `${apiPublicUrl}/api` }],
  }
})
