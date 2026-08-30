import { base } from '../../base'
import { orderingErrors } from '../../errors'
import { bff } from '../../meta'
import {
  animeEpisodeListSchema,
  reorderAnimeEpisodesForSeasonInputSchema,
} from '../../schemas'

export const reorderSeasonEpisodesContract = base
  .errors(orderingErrors)
  .meta(bff('admin'))
  .route({
    method: 'PUT',
    path: '/seasons/{seasonId}/episodes/order',
    tags: ['Anime episodes'],
    summary: 'Reorder season episodes',
  })
  .input(reorderAnimeEpisodesForSeasonInputSchema)
  .output(animeEpisodeListSchema)
