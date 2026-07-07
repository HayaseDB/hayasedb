import { oc } from '@orpc/contract'

import '@orpc/openapi/extensions/route'
import * as z from 'zod'

export const meContract = oc
  .route({
    method: 'GET',
    path: '/me',
    tags: ['User'],
    summary: 'Get the current user',
  })
  .output(
    z.object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
      role: z.string().nullable(),
    }),
  )
