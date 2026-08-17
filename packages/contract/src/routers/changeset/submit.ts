import { base } from '../../base'
import { bff } from '../../meta'
import {
  changesetDetailSchema,
  submitChangesetInputSchema,
} from '../../schemas'

export const submitChangesetContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/changesets',
    tags: ['Changesets'],
    summary: 'Submit changeset',
  })
  .input(submitChangesetInputSchema)
  .output(changesetDetailSchema)
