import { base } from '../../base'
import { bff } from '../../meta'
import { createGenreInputSchema, genreSchema } from '../../schemas'

export const createGenreContract = base
  .meta(bff('admin'))
  .route({
    method: 'POST',
    path: '/genres',
    tags: ['Genre'],
    summary: 'Create genre',
  })
  .input(createGenreInputSchema)
  .output(genreSchema)
