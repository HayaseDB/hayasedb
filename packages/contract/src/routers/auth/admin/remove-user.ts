import * as z from 'zod'
import { base } from '../../../base'
import { bff } from '../../../meta'
import { successSchema, userIdSchema } from '../../../schemas/auth'

export const adminRemoveUserContract = base
  .meta(bff('admin'))
  .route({
    method: 'DELETE',
    path: '/auth/admin/users/{id}',
    tags: ['Administration'],
    summary: 'Delete user',
  })
  .input(z.object({ id: userIdSchema }))
  .output(successSchema)
