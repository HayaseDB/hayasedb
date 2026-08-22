import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { newPasswordSchema, successSchema } from '../../schemas/auth'

export const resetPasswordContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/auth/reset-password',
    tags: ['Authentication'],
    summary: 'Reset password',
  })
  .input(z.object({ token: z.string().min(1), newPassword: newPasswordSchema }))
  .output(successSchema)
