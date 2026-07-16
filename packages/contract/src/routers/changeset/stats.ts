import { base } from '../../base'
import { changesetStatsSchema } from '../../schemas'

export const changesetStatsContract = base
  .route({
    method: 'GET',
    path: '/changesets/stats',
    tags: ['Changesets'],
    summary: 'Get changeset stats',
  })
  .output(changesetStatsSchema)
