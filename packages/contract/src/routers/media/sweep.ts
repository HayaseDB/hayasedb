import * as z from 'zod'
import { base } from '../../base'

export const sweepMediaContract = base
  .route({
    method: 'POST',
    path: '/media/sweep',
    tags: ['Media'],
    summary: 'Sweep unreferenced media',
  })
  .output(z.object({ deleted: z.number().int() }))
