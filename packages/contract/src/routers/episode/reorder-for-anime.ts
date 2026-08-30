import { base } from '../../base'
import { orderingErrors } from '../../errors'
import { bff } from '../../meta'
import {
  animeEpisodeListSchema,
  reorderAnimeEpisodesForAnimeInputSchema,
} from '../../schemas'

export const reorderAnimeEpisodesContract = base
  .errors(orderingErrors)
  .meta(bff('admin'))
  .route({
    method: 'PUT',
    path: '/anime/{animeId}/episodes/order',
    tags: ['Anime episodes'],
    summary: 'Reorder direct anime episodes',
  })
  .input(reorderAnimeEpisodesForAnimeInputSchema)
  .output(animeEpisodeListSchema)
