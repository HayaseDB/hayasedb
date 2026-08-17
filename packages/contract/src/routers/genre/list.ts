import * as z from 'zod'
import { base } from '../../base'
import { apiKeyAllowed, bff } from '../../meta'
import { genreListItemSchema } from '../../schemas'

export const listGenresContract = base
  .meta(apiKeyAllowed())
  .meta(bff('web', 'admin'))
  .route({
    method: 'GET',
    path: '/genres',
    tags: ['Genre'],
    summary: 'List genres',
  })
  .output(z.object({ items: z.array(genreListItemSchema) }))
