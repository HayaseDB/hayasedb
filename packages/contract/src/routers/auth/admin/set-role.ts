import * as z from 'zod'
import { base } from '../../../base'
import { bff } from '../../../meta'
import {
  adminUserEnvelopeSchema,
  userIdSchema,
  userRoles,
} from '../../../schemas/auth'

export const adminSetRoleContract = base
  .meta(bff('admin'))
  .route({
    method: 'POST',
    path: '/auth/admin/users/{id}/role',
    tags: ['Administration'],
    summary: 'Set user role',
  })
  .input(z.object({ id: userIdSchema, role: z.enum(userRoles) }))
  .output(adminUserEnvelopeSchema)
