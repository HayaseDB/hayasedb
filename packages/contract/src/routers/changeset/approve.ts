import * as z from 'zod'
import { base } from '../../base'
import { changesetDetailSchema, idSchema } from '../../schemas'

export const approveChangesetContract = base
  .route({
    method: 'POST',
    path: '/changesets/{id}/approve',
    tags: ['Changesets'],
    summary: 'Approve changeset',
  })
  .input(z.object({ id: idSchema }))
  .output(changesetDetailSchema)
