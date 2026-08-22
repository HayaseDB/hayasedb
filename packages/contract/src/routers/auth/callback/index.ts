import { callbackOAuthGetContract } from './get'
import { callbackOAuthPostContract } from './post'

export const oauthCallbackContract = {
  get: callbackOAuthGetContract,
  post: callbackOAuthPostContract,
}

export * from './get'
export * from './post'
