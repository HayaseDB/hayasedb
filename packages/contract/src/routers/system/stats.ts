import { base } from '../../base'
import { apiKeyAllowed, bff, cacheable } from '../../meta'
import { systemStatsSchema } from '../../schemas'

export const statsContract = base
  .meta(apiKeyAllowed())
  .meta(bff('web', 'admin'))
  .meta(cacheable(10))
  .route({
    method: 'GET',
    path: '/stats',
    tags: ['System'],
    summary: 'Public platform stats',
  })
  .output(systemStatsSchema)
