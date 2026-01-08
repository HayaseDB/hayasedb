import type { Contribution } from '../../types/contribution'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await authFetchApi<Contribution>(event, `/contributions/${id}`)
})
