import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { accountRowSchema } from '../../schemas/auth'

export const listAccountsContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'GET',
    path: '/auth/accounts',
    tags: ['Authentication'],
    summary: 'List linked accounts',
  })
  .output(z.array(accountRowSchema))
