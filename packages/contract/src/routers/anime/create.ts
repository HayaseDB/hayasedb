import { base } from '../../base'
import { bff } from '../../meta'
import { animeDetailSchema, createAnimeInputSchema } from '../../schemas'

export const createAnimeContract = base
  .meta(bff('admin'))
  .route({
    method: 'POST',
    path: '/anime',
    tags: ['Anime'],
    summary: 'Create anime',
  })
  .input(createAnimeInputSchema)
  .output(animeDetailSchema)
