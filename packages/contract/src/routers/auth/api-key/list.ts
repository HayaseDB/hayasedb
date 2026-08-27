import * as z from 'zod'
import { base } from '../../../base'
import { bff } from '../../../meta'
import { apiKeySchema, apiKeyUsageSchema } from '../../../schemas/auth'

export const apiKeyListContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'GET',
    path: '/auth/api-keys',
    tags: ['API Keys'],
    summary: 'List API keys',
  })
  .output(
    z.object({
      items: z.array(apiKeySchema.extend({ usage: apiKeyUsageSchema })),
      meta: z.object({ total: z.number().int().min(0) }),
    }),
  )
