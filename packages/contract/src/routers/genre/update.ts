import { base } from '../../base'
import { genreSchema, updateGenreInputSchema } from '../../schemas'

export const updateGenreContract = base
  .route({
    method: 'PATCH',
    path: '/genres/{id}',
    tags: ['Genre'],
    summary: 'Update genre',
  })
  .input(updateGenreInputSchema)
  .output(genreSchema)
