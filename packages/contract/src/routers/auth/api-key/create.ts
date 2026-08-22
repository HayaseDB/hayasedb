import * as z from 'zod'
import { base } from '../../../base'
import { bff } from '../../../meta'
import { apiKeyWithSecretSchema } from '../../../schemas/auth'

export const apiKeyCreateContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/auth/api-keys',
    tags: ['API Keys'],
    summary: 'Create API key',
  })
  .input(
    z.object({
      name: z.string().trim().min(1).max(100),
      expiresIn: z.number().int().positive().nullish(),
    }),
  )
  .output(apiKeyWithSecretSchema)
