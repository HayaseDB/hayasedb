import { base } from '../../../base'
import { bff } from '../../../meta'
import {
  adminCreateUserSchema,
  adminUserEnvelopeSchema,
} from '../../../schemas/auth'

export const adminCreateUserContract = base
  .meta(bff('admin'))
  .route({
    method: 'POST',
    path: '/auth/admin/users',
    tags: ['Administration'],
    summary: 'Create user',
  })
  .input(adminCreateUserSchema)
  .output(adminUserEnvelopeSchema)
