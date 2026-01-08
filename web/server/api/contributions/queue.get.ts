import type { Contribution } from '../../types/contribution'
import type { Paginated } from '../../types/pagination'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const queryString = new URLSearchParams(query as Record<string, string>).toString()
  const path = queryString ? `/contributions/queue?${queryString}` : '/contributions/queue'

  return await authFetchApi<Paginated<Contribution>>(event, path)
})
