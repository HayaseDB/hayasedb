import { base } from '../../base'
import { createGenreInputSchema, genreSchema } from '../../schemas'

export const createGenreContract = base
  .route({
    method: 'POST',
    path: '/genres',
    tags: ['Genre'],
    summary: 'Create genre',
  })
  .input(createGenreInputSchema)
  .output(genreSchema)
