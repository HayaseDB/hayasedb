import * as z from 'zod'
import { base } from '../../../base'
import { bff } from '../../../meta'
import {
  oauthCallbackParamsSchema,
  oauthCallbackQuerySchema,
  oauthRedirectOutputSchema,
} from '../../../schemas/auth'

export const callbackOAuthGetContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'GET',
    path: '/auth/callback/{id}',
    tags: ['Authentication'],
    summary: 'OAuth callback',
    inputStructure: 'detailed',
    outputStructure: 'detailed',
    successStatus: 302,
  })
  .input(
    z.object({
      params: oauthCallbackParamsSchema,
      query: oauthCallbackQuerySchema,
    }),
  )
  .output(oauthRedirectOutputSchema)
