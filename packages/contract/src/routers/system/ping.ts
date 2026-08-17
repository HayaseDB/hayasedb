import * as z from 'zod'
import { base } from '../../base'
import { apiKeyAllowed } from '../../meta'

export const pingContract = base
  .meta(apiKeyAllowed())
  .route({
    method: 'GET',
    path: '/ping',
    tags: ['System'],
    summary: 'Health check',
  })
  .input(z.object({ message: z.string().optional() }))
  .output(
    z.object({
      ok: z.literal(true),
      ts: z.number(),
      echo: z.string().optional(),
    }),
  )
