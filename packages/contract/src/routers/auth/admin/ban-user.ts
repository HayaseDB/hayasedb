import { base } from '../../../base'
import { bff } from '../../../meta'
import {
  adminBanUserSchema,
  adminUserEnvelopeSchema,
  userIdSchema,
} from '../../../schemas/auth'

export const adminBanUserContract = base
  .meta(bff('admin'))
  .route({
    method: 'POST',
    path: '/auth/admin/users/{id}/ban',
    tags: ['Administration'],
    summary: 'Ban user',
  })
  .input(adminBanUserSchema.extend({ id: userIdSchema }))
  .output(adminUserEnvelopeSchema)
