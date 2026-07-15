import * as z from 'zod'
import { base } from '../../base'
import { removeGenreInputSchema } from '../../schemas'

export const removeGenreContract = base
  .route({
    method: 'DELETE',
    path: '/genres/{id}',
    tags: ['Genre'],
    summary: 'Delete genre',
  })
  .input(removeGenreInputSchema)
  .output(z.object({ success: z.boolean() }))
