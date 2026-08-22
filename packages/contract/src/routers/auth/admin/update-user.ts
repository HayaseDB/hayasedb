import * as z from 'zod'
import { base } from '../../../base'
import { bff } from '../../../meta'
import {
  adminUserEnvelopeSchema,
  emailSchema,
  nameSchema,
  userIdSchema,
} from '../../../schemas/auth'

export const adminUpdateUserContract = base
  .meta(bff('admin'))
  .route({
    method: 'PATCH',
    path: '/auth/admin/users/{id}',
    tags: ['Administration'],
    summary: 'Update user',
  })
  .input(
    z.object({
      id: userIdSchema,
      name: nameSchema.optional(),
      email: emailSchema.optional(),
    }),
  )
  .output(adminUserEnvelopeSchema)
