import { base } from '../../base'
import {
  changesetDetailSchema,
  submitChangesetInputSchema,
} from '../../schemas'

export const submitChangesetContract = base
  .route({
    method: 'POST',
    path: '/changesets',
    tags: ['Changesets'],
    summary: 'Submit changeset',
  })
  .input(submitChangesetInputSchema)
  .output(changesetDetailSchema)
