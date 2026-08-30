import { base } from '../../base'
import { bff } from '../../meta'
import {
  animeEpisodeSchema,
  createAnimeEpisodeForAnimeInputSchema,
} from '../../schemas'

export const createAnimeEpisodeContract = base
  .meta(bff('admin'))
  .route({
    method: 'POST',
    path: '/anime/{animeId}/episodes',
    tags: ['Anime episodes'],
    summary: 'Create a direct anime episode',
    successStatus: 201,
  })
  .input(createAnimeEpisodeForAnimeInputSchema)
  .output(animeEpisodeSchema)
