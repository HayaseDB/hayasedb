import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import {
  currentPasswordSchema,
  newPasswordSchema,
  sessionUserSchema,
} from '../../schemas/auth'

export const changePasswordContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/auth/me/password',
    tags: ['Authentication'],
    summary: 'Change password',
  })
  .input(
    z.object({
      currentPassword: currentPasswordSchema,
      newPassword: newPasswordSchema,
      revokeOtherSessions: z.boolean().optional(),
    }),
  )
  .output(z.object({ token: z.string().nullish(), user: sessionUserSchema }))
