import { base } from '../../base'
import { apiKeyAllowed, bff, cacheable } from '../../meta'
import {
  animeEpisodeListSchema,
  listAnimeEpisodesInputSchema,
} from '../../schemas'

export const listAnimeEpisodesContract = base
  .meta(apiKeyAllowed())
  .meta(bff('web', 'admin'))
  .meta(cacheable(15, 60))
  .route({
    method: 'GET',
    path: '/anime/{animeId}/episodes',
    tags: ['Anime episodes'],
    summary: 'List anime episodes',
  })
  .input(listAnimeEpisodesInputSchema)
  .output(animeEpisodeListSchema)
