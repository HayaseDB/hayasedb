import * as z from 'zod'
import { base } from '../../../base'
import { bff } from '../../../meta'
import {
  oauthCallbackParamsSchema,
  oauthCallbackQuerySchema,
  oauthRedirectOutputSchema,
} from '../../../schemas/auth'

export const callbackOAuthPostContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/auth/callback/{id}',
    tags: ['Authentication'],
    summary: 'OAuth callback (form post)',
    inputStructure: 'detailed',
    outputStructure: 'detailed',
    successStatus: 302,
  })
  .input(
    z.object({
      params: oauthCallbackParamsSchema,
      query: oauthCallbackQuerySchema,
      body: oauthCallbackQuerySchema.optional(),
    }),
  )
  .output(oauthRedirectOutputSchema)
