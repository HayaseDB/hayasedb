import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { newPasswordSchema } from '../../schemas/auth'

export const setPasswordContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/account/set-password',
    tags: ['Account'],
    summary: 'Set password',
  })
  .input(z.object({ newPassword: newPasswordSchema }))
  .output(z.object({ success: z.boolean() }))
