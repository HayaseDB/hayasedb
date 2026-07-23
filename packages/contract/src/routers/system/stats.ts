import { base } from '../../base'
import { systemStatsSchema } from '../../schemas'

export const statsContract = base
  .route({
    method: 'GET',
    path: '/stats',
    tags: ['System'],
    summary: 'Public platform stats',
  })
  .output(systemStatsSchema)
