import { oc } from '@orpc/contract'

import '@orpc/openapi/extensions/route'
import * as z from 'zod'

export const pingContract = oc
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
