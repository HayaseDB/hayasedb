import * as z from 'zod'
import { base } from '../../base'
import {
  changesetDetailSchema,
  changesetMessageBodySchema,
  idSchema,
} from '../../schemas'

export const rejectChangesetContract = base
  .route({
    method: 'POST',
    path: '/changesets/{id}/reject',
    tags: ['Changesets'],
    summary: 'Reject changeset',
  })
  .input(z.object({ id: idSchema, reason: changesetMessageBodySchema }))
  .output(changesetDetailSchema)
