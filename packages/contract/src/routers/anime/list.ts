import * as z from 'zod'
import { base } from '../../base'
import {
  animeListItemSchema,
  listAnimeInputSchema,
  paginationMetaSchema,
} from '../../schemas'

export const listAnimeContract = base
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
