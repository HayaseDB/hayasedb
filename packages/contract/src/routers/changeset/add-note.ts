import * as z from 'zod'
import { base } from '../../base'
import {
  changesetNoteBodySchema,
  changesetNoteSchema,
  idSchema,
} from '../../schemas'

export const addChangesetNoteContract = base
  .route({
    method: 'POST',
    path: '/changesets/{id}/notes',
    tags: ['Changesets'],
    summary: 'Add changeset note',
  })
  .input(z.object({ id: idSchema, body: changesetNoteBodySchema }))
  .output(changesetNoteSchema)
