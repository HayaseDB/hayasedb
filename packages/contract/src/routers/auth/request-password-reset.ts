import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { emailSchema, successSchema } from '../../schemas/auth'

export const requestPasswordResetContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/auth/reset-password/request',
    tags: ['Authentication'],
    summary: 'Request password reset',
  })
  .input(z.object({ email: emailSchema, redirectTo: z.string().optional() }))
  .output(successSchema.extend({ message: z.string() }))
