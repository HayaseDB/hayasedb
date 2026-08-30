import { base } from '../../base'
import { bff } from '../../meta'
import {
  animeEpisodeSchema,
  updateAnimeEpisodeInputSchema,
} from '../../schemas'

export const updateAnimeEpisodeContract = base
  .meta(bff('admin'))
  .route({
    method: 'PATCH',
    path: '/episodes/{id}',
    tags: ['Anime episodes'],
    summary: 'Update an anime episode',
  })
  .input(updateAnimeEpisodeInputSchema)
  .output(animeEpisodeSchema)
