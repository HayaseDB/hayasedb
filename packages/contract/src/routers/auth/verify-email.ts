import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { successSchema } from '../../schemas/auth'

export const verifyEmailContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'GET',
    path: '/auth/verify-email',
    tags: ['Authentication'],
    summary: 'Verify email',
  })
  .input(z.object({ token: z.string().min(1) }))
  .output(successSchema)
