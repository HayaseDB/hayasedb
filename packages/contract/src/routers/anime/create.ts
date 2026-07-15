import { base } from '../../base'
import { animeDetailSchema, createAnimeInputSchema } from '../../schemas'

export const createAnimeContract = base
  .route({
    method: 'POST',
    path: '/anime',
    tags: ['Anime'],
    summary: 'Create anime',
  })
  .input(createAnimeInputSchema)
  .output(animeDetailSchema)
