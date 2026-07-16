import * as z from 'zod'
import { base } from '../../base'
import { changesetDetailSchema, idSchema } from '../../schemas'

export const getChangesetContract = base
  .route({
    method: 'GET',
    path: '/changesets/{id}',
    tags: ['Changesets'],
    summary: 'Get changeset',
  })
  .input(z.object({ id: idSchema }))
  .output(changesetDetailSchema)
