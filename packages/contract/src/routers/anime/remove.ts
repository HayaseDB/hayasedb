import * as z from 'zod'
import { base } from '../../base'
import { idSchema } from '../../schemas'

export const removeAnimeContract = base
  .route({
    method: 'DELETE',
    path: '/anime/{id}',
    tags: ['Anime'],
    summary: 'Delete anime',
  })
  .input(z.object({ id: idSchema }))
  .output(z.object({ success: z.boolean() }))
