import { base } from '../../base'
import { bff } from '../../meta'
import { genreSchema, updateGenreInputSchema } from '../../schemas'

export const updateGenreContract = base
  .meta(bff('admin'))
  .route({
    method: 'PATCH',
    path: '/genres/{id}',
    tags: ['Genre'],
    summary: 'Update genre',
  })
  .input(updateGenreInputSchema)
  .output(genreSchema)
