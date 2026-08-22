import * as z from 'zod'
import { base } from '../../../base'
import { bff } from '../../../meta'
import { sessionSchema, userIdSchema } from '../../../schemas/auth'

export const adminListUserSessionsContract = base
  .meta(bff('admin'))
  .route({
    method: 'GET',
    path: '/auth/admin/users/{id}/sessions',
    tags: ['Administration'],
    summary: 'List user sessions',
  })
  .input(z.object({ id: userIdSchema }))
  .output(z.array(sessionSchema))
