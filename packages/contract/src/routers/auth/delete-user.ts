import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { currentPasswordSchema, successSchema } from '../../schemas/auth'

export const deleteUserContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'DELETE',
    path: '/auth/me',
    tags: ['Authentication'],
    summary: 'Delete account',
  })
  .input(
    z.object({
      password: currentPasswordSchema.optional(),
      token: z.string().min(1).optional(),
    }),
  )
  .output(successSchema.extend({ message: z.string() }))
