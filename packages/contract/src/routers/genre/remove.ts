import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { removeGenreInputSchema } from '../../schemas'

export const removeGenreContract = base
  .meta(bff('admin'))
  .route({
    method: 'DELETE',
    path: '/genres/{id}',
    tags: ['Genre'],
    summary: 'Delete genre',
  })
  .input(removeGenreInputSchema)
  .output(z.object({ success: z.boolean() }))
