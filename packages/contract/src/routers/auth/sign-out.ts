import { base } from '../../base'
import { bff } from '../../meta'
import { successSchema } from '../../schemas/auth'

export const signOutContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/auth/sign-out',
    tags: ['Authentication'],
    summary: 'Sign out',
  })
  .output(successSchema)
