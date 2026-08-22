import * as z from 'zod'
import { base } from '../../../base'
import { bff } from '../../../meta'
import {
  newPasswordSchema,
  successSchema,
  userIdSchema,
} from '../../../schemas/auth'

export const adminSetUserPasswordContract = base
  .meta(bff('admin'))
  .route({
    method: 'POST',
    path: '/auth/admin/users/{id}/password',
    tags: ['Administration'],
    summary: 'Set user password',
  })
  .input(z.object({ id: userIdSchema, newPassword: newPasswordSchema }))
  .output(successSchema)
