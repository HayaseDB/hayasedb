import { base } from '../../base'
import { addAnimeMediaInputSchema, animeDetailSchema } from '../../schemas'

export const addAnimeMediaContract = base
  .route({
    method: 'POST',
    path: '/anime/{animeId}/media',
    tags: ['Anime'],
    summary: 'Add anime media',
  })
  .input(addAnimeMediaInputSchema)
  .output(animeDetailSchema)
