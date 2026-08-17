import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { changesetDetailSchema, idSchema } from '../../schemas'

export const getChangesetContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'GET',
    path: '/changesets/{id}',
    tags: ['Changesets'],
    summary: 'Get changeset',
  })
  .input(z.object({ id: idSchema }))
  .output(changesetDetailSchema)
