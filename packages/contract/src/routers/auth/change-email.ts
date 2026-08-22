import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { emailSchema, successSchema } from '../../schemas/auth'

export const changeEmailContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/auth/me/email',
    tags: ['Authentication'],
    summary: 'Change email',
  })
  .input(
    z.object({ newEmail: emailSchema, callbackURL: z.string().optional() }),
  )
  .output(successSchema)
