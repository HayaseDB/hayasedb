import * as z from 'zod'
import { base } from '../../../base'
import { bff } from '../../../meta'
import { successSchema } from '../../../schemas/auth'

export const adminRevokeUserSessionContract = base
  .meta(bff('admin'))
  .route({
    method: 'DELETE',
    path: '/auth/admin/sessions/{sessionToken}',
    tags: ['Administration'],
    summary: 'Revoke user session',
  })
  .input(z.object({ sessionToken: z.string().min(1) }))
  .output(successSchema)
