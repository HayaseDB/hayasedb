import * as z from 'zod'
import { base } from '../../base'
import { changesetDetailSchema, idSchema } from '../../schemas'

export const withdrawChangesetContract = base
  .route({
    method: 'POST',
    path: '/changesets/{id}/withdraw',
    tags: ['Changesets'],
    summary: 'Withdraw changeset',
  })
  .input(z.object({ id: idSchema }))
  .output(changesetDetailSchema)
