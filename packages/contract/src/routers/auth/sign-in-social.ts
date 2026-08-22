import { base } from '../../base'
import { bff } from '../../meta'
import {
  socialSignInInputSchema,
  socialSignInOutputSchema,
} from '../../schemas/auth'

export const signInSocialContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/auth/sign-in/social',
    tags: ['Authentication'],
    summary: 'Sign in with a provider',
  })
  .input(socialSignInInputSchema)
  .output(socialSignInOutputSchema)
