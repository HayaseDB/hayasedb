import * as z from 'zod'
import { base } from '../../base'
import { idSchema, revisionDetailSchema } from '../../schemas'

export const getRevisionContract = base
  .route({
    method: 'GET',
    path: '/revisions/{id}',
    tags: ['Revisions'],
    summary: 'Get revision',
  })
  .input(z.object({ id: idSchema }))
  .output(revisionDetailSchema)
