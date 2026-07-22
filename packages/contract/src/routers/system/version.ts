import * as z from 'zod'
import { base } from '../../base'

export const versionContract = base
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
    }),
  )
