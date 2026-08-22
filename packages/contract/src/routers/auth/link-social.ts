import { base } from '../../base'
import { bff } from '../../meta'
import {
  socialSignInInputSchema,
  socialSignInOutputSchema,
} from '../../schemas/auth'

export const linkSocialContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/auth/accounts/link',
    tags: ['Authentication'],
    summary: 'Link a provider account',
  })
  .input(socialSignInInputSchema)
  .output(socialSignInOutputSchema)
