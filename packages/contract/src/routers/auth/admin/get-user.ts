import * as z from 'zod'
import { base } from '../../../base'
import { bff } from '../../../meta'
import { sessionUserSchema, userIdSchema } from '../../../schemas/auth'

export const adminGetUserContract = base
  .meta(bff('admin'))
  .route({
    method: 'GET',
    path: '/auth/admin/users/{id}',
    tags: ['Administration'],
    summary: 'Get user',
  })
  .input(z.object({ id: userIdSchema }))
  .output(sessionUserSchema)
