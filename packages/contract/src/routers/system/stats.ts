import { base } from '../../base'
import { apiKeyAllowed, bff } from '../../meta'
import { systemStatsSchema } from '../../schemas'

export const statsContract = base
  .meta(apiKeyAllowed())
  .meta(bff('web', 'admin'))
  .route({
    method: 'GET',
    path: '/stats',
    tags: ['System'],
    summary: 'Public platform stats',
  })
  .output(systemStatsSchema)
