import * as z from 'zod'
import { base } from '../../base'
import {
  listRevisionsInputSchema,
  paginationMetaSchema,
  revisionListItemSchema,
} from '../../schemas'

export const listRevisionsContract = base
  .route({
    method: 'GET',
    path: '/revisions',
    tags: ['Revisions'],
    summary: 'List revisions',
  })
  .input(listRevisionsInputSchema)
  .output(
    z.object({
      items: z.array(revisionListItemSchema),
      meta: paginationMetaSchema,
    }),
  )
