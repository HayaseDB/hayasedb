import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { successSchema } from '../../schemas/auth'

export const unlinkAccountContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'DELETE',
    path: '/auth/accounts/{providerId}',
    tags: ['Authentication'],
    summary: 'Unlink account',
  })
  .input(
    z.object({
      providerId: z.string().min(1),
      accountId: z.string().min(1).optional(),
    }),
  )
  .output(successSchema)
