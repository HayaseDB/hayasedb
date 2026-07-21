import * as z from 'zod'
import { base } from '../../base'
import {
  changesetMessageBodySchema,
  changesetMessageSchema,
  idSchema,
} from '../../schemas'

export const addChangesetMessageContract = base
  .route({
    method: 'POST',
    path: '/changesets/{id}/messages',
    tags: ['Changesets'],
    summary: 'Add changeset message',
  })
  .input(z.object({ id: idSchema, body: changesetMessageBodySchema }))
  .output(changesetMessageSchema)
