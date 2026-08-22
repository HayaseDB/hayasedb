import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { registerSchema, sessionUserSchema } from '../../schemas/auth'

export const signUpEmailContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/auth/sign-up/email',
    tags: ['Authentication'],
    summary: 'Sign up',
  })
  .input(registerSchema)
  .output(
    z.object({
      token: z.string().nullable(),
      user: sessionUserSchema,
    }),
  )
