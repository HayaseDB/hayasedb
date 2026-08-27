import * as z from 'zod'
import { base } from '../../base'
import { apiKeyAllowed, bff, cacheable } from '../../meta'
import { genreListItemSchema, listGenresInputSchema } from '../../schemas'

export const listGenresContract = base
  .meta(apiKeyAllowed())
  .meta(bff('web', 'admin'))
  .meta(cacheable(60, 300))
  .route({
    method: 'GET',
    path: '/genres',
    tags: ['Genre'],
    summary: 'List genres',
  })
  .input(listGenresInputSchema)
  .output(
    z.object({
      items: z.array(genreListItemSchema),
      meta: z.object({ total: z.number().int().min(0) }),
    }),
  )
