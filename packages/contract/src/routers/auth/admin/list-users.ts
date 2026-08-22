import { base } from '../../../base'
import { bff } from '../../../meta'
import {
  adminListUsersInputSchema,
  adminListUsersOutputSchema,
} from '../../../schemas/auth'

export const adminListUsersContract = base
  .meta(bff('admin'))
  .route({
    method: 'GET',
    path: '/auth/admin/users',
    tags: ['Administration'],
    summary: 'List users',
  })
  .input(adminListUsersInputSchema)
  .output(adminListUsersOutputSchema)
