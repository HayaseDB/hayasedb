import * as z from 'zod'
import { base } from '../../base'
import {
  changesetDetailSchema,
  changesetNoteBodySchema,
  idSchema,
} from '../../schemas'

export const rejectChangesetContract = base
  .route({
    method: 'POST',
    path: '/changesets/{id}/reject',
    tags: ['Changesets'],
    summary: 'Reject changeset',
  })
  .input(z.object({ id: idSchema, note: changesetNoteBodySchema }))
  .output(changesetDetailSchema)
