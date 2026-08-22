import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { sessionEnvelopeSchema } from '../../schemas/auth'
import { queryBooleanSchema } from '../../schemas/common'

export const getSessionContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'GET',
    path: '/auth/session',
    tags: ['Authentication'],
    summary: 'Get session',
  })
  .input(z.object({ disableCookieCache: queryBooleanSchema.optional() }))
  .output(sessionEnvelopeSchema.nullable())
