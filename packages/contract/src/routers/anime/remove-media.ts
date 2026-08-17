import { base } from '../../base'
import { bff } from '../../meta'
import { animeDetailSchema, removeAnimeMediaInputSchema } from '../../schemas'

export const removeAnimeMediaContract = base
  .meta(bff('admin'))
  .route({
    method: 'DELETE',
    path: '/anime/media/{id}',
    tags: ['Anime'],
    summary: 'Remove anime media',
  })
  .input(removeAnimeMediaInputSchema)
  .output(animeDetailSchema)
