import { base } from '../../base'
import { animeDetailSchema, updateAnimeInputSchema } from '../../schemas'

export const updateAnimeContract = base
  .route({
    method: 'PATCH',
    path: '/anime/{id}',
    tags: ['Anime'],
    summary: 'Update anime',
  })
  .input(updateAnimeInputSchema)
  .output(animeDetailSchema)
