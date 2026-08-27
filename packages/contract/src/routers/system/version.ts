import * as z from 'zod'
import { base } from '../../base'
import { apiKeyAllowed, cacheable } from '../../meta'

export const versionContract = base
  .meta(apiKeyAllowed())
  .meta(cacheable(60))
  .route({
    method: 'GET',
    path: '/version',
    tags: ['System'],
    summary: 'App version',
  })
  .output(
    z.object({
      name: z.string(),
      version: z.string(),
      commit: z.string(),
    }),
  )
