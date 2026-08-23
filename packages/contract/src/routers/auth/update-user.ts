import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { nameSchema, successSchema } from '../../schemas/auth'

export const updateUserContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'PATCH',
    path: '/auth/me',
    tags: ['Authentication'],
    summary: 'Update profile',
  })
  .input(
    z.object({
      name: nameSchema.optional(),
    }),
  )
  .output(successSchema)
