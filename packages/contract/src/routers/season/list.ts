import { base } from '../../base'
import { apiKeyAllowed, bff, cacheable } from '../../meta'
import {
  animeSeasonListSchema,
  idSchema,
  listStructureInputSchema,
} from '../../schemas'

export const listAnimeSeasonsContract = base
  .meta(apiKeyAllowed())
  .meta(bff('web', 'admin'))
  .meta(cacheable(15, 60))
  .route({
    method: 'GET',
    path: '/anime/{animeId}/seasons',
    tags: ['Anime seasons'],
    summary: 'List anime seasons',
  })
  .input(listStructureInputSchema.extend({ animeId: idSchema }))
  .output(animeSeasonListSchema)
