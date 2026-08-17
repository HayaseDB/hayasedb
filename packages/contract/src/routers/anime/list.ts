import * as z from 'zod'
import { base } from '../../base'
import { apiKeyAllowed, bff } from '../../meta'
import {
  animeListItemSchema,
  listAnimeInputSchema,
  paginationMetaSchema,
} from '../../schemas'

export const listAnimeContract = base
  .meta(apiKeyAllowed())
  .meta(bff('web', 'admin'))
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
      meta: paginationMetaSchema,
    }),
  )
