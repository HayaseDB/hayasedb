import { base } from '../../base'
import { animeDetailSchema, removeAnimeMediaInputSchema } from '../../schemas'

export const removeAnimeMediaContract = base
  .route({
    method: 'DELETE',
    path: '/anime/media/{id}',
    tags: ['Anime'],
    summary: 'Remove anime media',
  })
  .input(removeAnimeMediaInputSchema)
  .output(animeDetailSchema)
