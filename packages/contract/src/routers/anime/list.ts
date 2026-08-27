import * as z from 'zod'
import { base } from '../../base'
import { apiKeyAllowed, bff, cacheable } from '../../meta'
import {
  animeListItemSchema,
  cursorPaginationMetaSchema,
  listAnimeInputSchema,
} from '../../schemas'

export const listAnimeContract = base
  .meta(apiKeyAllowed())
  .meta(bff('web', 'admin'))
  .meta(cacheable(10, 30))
  .route({
    method: 'GET',
    path: '/anime',
    tags: ['Anime'],
    summary: 'List anime',
  })
  .input(listAnimeInputSchema)
  .output(
    z.object({
      items: z.array(animeListItemSchema),
      meta: cursorPaginationMetaSchema,
    }),
  )
