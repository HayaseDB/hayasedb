import * as z from 'zod'
import { base } from '../../../base'
import { bff } from '../../../meta'
import { successSchema, userIdSchema } from '../../../schemas/auth'

export const adminRevokeUserSessionsContract = base
  .meta(bff('admin'))
  .route({
    method: 'DELETE',
    path: '/auth/admin/users/{id}/sessions',
    tags: ['Administration'],
    summary: 'Revoke user sessions',
  })
  .input(z.object({ id: userIdSchema }))
  .output(successSchema)
