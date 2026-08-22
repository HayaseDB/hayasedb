import { base } from '../../base'
import { bff } from '../../meta'
import { successSchema } from '../../schemas/auth'

export const revokeOtherSessionsContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'DELETE',
    path: '/auth/sessions',
    tags: ['Authentication'],
    summary: 'Revoke other sessions',
  })
  .output(successSchema)
