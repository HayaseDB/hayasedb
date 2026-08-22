import * as z from 'zod'
import { base } from '../../../base'
import { bff } from '../../../meta'
import { adminUserEnvelopeSchema, userIdSchema } from '../../../schemas/auth'

export const adminUnbanUserContract = base
  .meta(bff('admin'))
  .route({
    method: 'POST',
    path: '/auth/admin/users/{id}/unban',
    tags: ['Administration'],
    summary: 'Unban user',
  })
  .input(z.object({ id: userIdSchema }))
  .output(adminUserEnvelopeSchema)
