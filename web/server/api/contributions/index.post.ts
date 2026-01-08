import type { Contribution } from '../../types/contribution'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return await authFetchApi<Contribution>(event, '/contributions', {
    method: 'POST',
    body,
  })
})
