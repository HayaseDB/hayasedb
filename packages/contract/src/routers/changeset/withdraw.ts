import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { changesetDetailSchema, idSchema } from '../../schemas'

export const withdrawChangesetContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/changesets/{id}/withdraw',
    tags: ['Changesets'],
    summary: 'Withdraw changeset',
  })
  .input(z.object({ id: idSchema }))
  .output(changesetDetailSchema)
