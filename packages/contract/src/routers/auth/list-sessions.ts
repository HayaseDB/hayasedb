import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { sessionSchema } from '../../schemas/auth'

export const listSessionsContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'GET',
    path: '/auth/sessions',
    tags: ['Authentication'],
    summary: 'List sessions',
  })
  .output(z.array(sessionSchema))
