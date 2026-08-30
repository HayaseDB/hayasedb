import { base } from '../../base'
import { apiKeyAllowed, bff, cacheable } from '../../meta'
import {
  animeEpisodeListSchema,
  idSchema,
  listStructureInputSchema,
} from '../../schemas'

export const listSeasonEpisodesContract = base
  .meta(apiKeyAllowed())
  .meta(bff('web', 'admin'))
  .meta(cacheable(15, 60))
  .route({
    method: 'GET',
    path: '/seasons/{seasonId}/episodes',
    tags: ['Anime episodes'],
    summary: 'List season episodes',
  })
  .input(listStructureInputSchema.extend({ seasonId: idSchema }))
  .output(animeEpisodeListSchema)
