import { base } from '../../base'
import { bff } from '../../meta'
import {
  animeEpisodeSchema,
  createAnimeEpisodeForSeasonInputSchema,
} from '../../schemas'

export const createSeasonEpisodeContract = base
  .meta(bff('admin'))
  .route({
    method: 'POST',
    path: '/seasons/{seasonId}/episodes',
    tags: ['Anime episodes'],
    summary: 'Create a season episode',
    successStatus: 201,
  })
  .input(createAnimeEpisodeForSeasonInputSchema)
  .output(animeEpisodeSchema)
