import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import {
  changesetListItemSchema,
  listChangesetsInputSchema,
  paginationMetaSchema,
} from '../../schemas'

export const listChangesetsContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'GET',
    path: '/changesets',
    tags: ['Changesets'],
    summary: 'List changesets',
  })
  .input(listChangesetsInputSchema)
  .output(
    z.object({
      items: z.array(changesetListItemSchema),
      meta: paginationMetaSchema,
    }),
  )
