import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { successSchema } from '../../schemas/auth'

export const revokeSessionContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'DELETE',
    path: '/auth/sessions/{token}',
    tags: ['Authentication'],
    summary: 'Revoke session',
  })
  .input(z.object({ token: z.string().min(1) }))
  .output(successSchema)
