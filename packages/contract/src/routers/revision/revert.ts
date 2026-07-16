import * as z from 'zod'
import { base } from '../../base'
import { changesetDetailSchema, idSchema } from '../../schemas'

export const revertToRevisionContract = base
  .route({
    method: 'POST',
    path: '/revisions/{id}/revert',
    tags: ['Revisions'],
    summary: 'Revert to revision',
  })
  .input(z.object({ id: idSchema }))
  .output(changesetDetailSchema)
