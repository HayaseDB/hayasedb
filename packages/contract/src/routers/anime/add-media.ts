import { base } from '../../base'
import { bff } from '../../meta'
import { addAnimeMediaInputSchema, animeDetailSchema } from '../../schemas'

export const addAnimeMediaContract = base
  .meta(bff('admin'))
  .route({
    method: 'POST',
    path: '/anime/{animeId}/media',
    tags: ['Anime'],
    summary: 'Add anime media',
  })
  .input(addAnimeMediaInputSchema)
  .output(animeDetailSchema)
