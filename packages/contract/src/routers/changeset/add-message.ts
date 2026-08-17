import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import {
  changesetMessageBodySchema,
  changesetMessageSchema,
  idSchema,
} from '../../schemas'

export const addChangesetMessageContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/changesets/{id}/messages',
    tags: ['Changesets'],
    summary: 'Add changeset message',
  })
  .input(z.object({ id: idSchema, body: changesetMessageBodySchema }))
  .output(changesetMessageSchema)
