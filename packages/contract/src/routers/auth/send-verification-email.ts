import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { emailSchema, successSchema } from '../../schemas/auth'

export const sendVerificationEmailContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/auth/verify-email/resend',
    tags: ['Authentication'],
    summary: 'Resend verification email',
  })
  .input(z.object({ email: emailSchema, callbackURL: z.string().optional() }))
  .output(successSchema)
