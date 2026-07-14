import * as z from 'zod'
import { base } from '../../base'
import { genreListItemSchema } from '../../schemas'

export const listGenresContract = base
  .route({
    method: 'GET',
    path: '/genres',
    tags: ['Genre'],
    summary: 'List genres',
  })
  .output(z.object({ items: z.array(genreListItemSchema) }))
