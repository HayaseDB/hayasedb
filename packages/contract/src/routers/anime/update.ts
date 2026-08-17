import { base } from '../../base'
import { bff } from '../../meta'
import { animeDetailSchema, updateAnimeInputSchema } from '../../schemas'

export const updateAnimeContract = base
  .meta(bff('admin'))
  .route({
    method: 'PATCH',
    path: '/anime/{id}',
    tags: ['Anime'],
    summary: 'Update anime',
  })
  .input(updateAnimeInputSchema)
  .output(animeDetailSchema)
