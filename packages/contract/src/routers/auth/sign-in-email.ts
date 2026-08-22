import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { loginSchema, sessionUserSchema } from '../../schemas/auth'

export const signInEmailContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/auth/sign-in/email',
    tags: ['Authentication'],
    summary: 'Sign in',
  })
  .input(loginSchema.extend({ rememberMe: z.boolean().optional() }))
  .output(
    z.object({
      redirect: z.boolean(),
      token: z.string().nullable(),
      url: z.string().nullish(),
      user: sessionUserSchema,
    }),
  )
