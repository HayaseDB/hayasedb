import type { Contribution } from '../../../types/contribution'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  return await authFetchApi<Contribution>(event, `/contributions/${id}/reject`, {
    method: 'POST',
    body,
  })
})
