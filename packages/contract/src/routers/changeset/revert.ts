import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import {
  changesetDetailSchema,
  changesetSummarySchema,
  idSchema,
} from '../../schemas'

export const revertChangesetContract = base
  .meta(bff('admin'))
  .route({
    method: 'POST',
    path: '/changesets/{id}/revert',
    tags: ['Changesets'],
    summary: 'Revert changeset',
  })
  .input(z.object({ id: idSchema, summary: changesetSummarySchema.optional() }))
  .output(changesetDetailSchema)
