import { base } from '../../base'
import { bff } from '../../meta'
import { changesetStatsSchema } from '../../schemas'

export const changesetStatsContract = base
  .meta(bff('admin'))
  .route({
    method: 'GET',
    path: '/changesets/stats',
    tags: ['Changesets'],
    summary: 'Get changeset stats',
  })
  .output(changesetStatsSchema)
