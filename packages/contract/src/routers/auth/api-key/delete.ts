import * as z from 'zod'
import { base } from '../../../base'
import { bff } from '../../../meta'
import { successSchema } from '../../../schemas/auth'

export const apiKeyDeleteContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'DELETE',
    path: '/auth/api-keys/{id}',
    tags: ['API Keys'],
    summary: 'Delete API key',
  })
  .input(z.object({ id: z.string().min(1) }))
  .output(successSchema)
