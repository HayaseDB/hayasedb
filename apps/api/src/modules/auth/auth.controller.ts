import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { contract } from '@hayasedb/contract'
import { RouteThrottle } from '../../auth/throttler'
import { forwardSetCookie } from '../../orpc/forward-set-cookie'
import { AuthFacade } from './auth.service'

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthFacade) {}

  @AllowAnonymous()
  @Implement(contract.auth.getSession)
  getSession() {
    return implement(contract.auth.getSession).handler(
      async ({ input, context }) => {
        const { headers, response } = await this.auth.getSession(
          context.request,
          input.disableCookieCache,
        )
        forwardSetCookie(context.request, headers)
        return response ?? null
      },
    )
  }

  @AllowAnonymous()
  @RouteThrottle(30)
  @Implement(contract.auth.signInEmail)
  signInEmail() {
    return implement(contract.auth.signInEmail).handler(
      async ({ input, context }) => {
        const { headers, response } = await this.auth.signInEmail(
          context.request,
          input,
        )
        forwardSetCookie(context.request, headers)
        return response
      },
    )
  }

  @AllowAnonymous()
  @RouteThrottle(30)
  @Implement(contract.auth.signUpEmail)
  signUpEmail() {
    return implement(contract.auth.signUpEmail).handler(
      async ({ input, context }) => {
        const { headers, response } = await this.auth.signUpEmail(
          context.request,
          input,
        )
        forwardSetCookie(context.request, headers)
        return response
      },
    )
  }

  @AllowAnonymous()
  @Implement(contract.auth.signOut)
  signOut() {
    return implement(contract.auth.signOut).handler(async ({ context }) => {
      const { headers, response } = await this.auth.signOut(context.request)
      forwardSetCookie(context.request, headers)
      return response
    })
  }

  @AllowAnonymous()
  @Implement(contract.auth.signInSocial)
  signInSocial() {
    return implement(contract.auth.signInSocial).handler(
      async ({ input, context }) => {
        const { headers, response } = await this.auth.signInSocial(
          context.request,
          input,
        )
        forwardSetCookie(context.request, headers)
        return { url: response.url, redirect: response.redirect }
      },
    )
  }

  @Implement(contract.auth.linkSocial)
  linkSocial() {
    return implement(contract.auth.linkSocial).handler(
      async ({ input, context }) => {
        const { headers, response } = await this.auth.linkSocialAccount(
          context.request,
          input,
        )
        forwardSetCookie(context.request, headers)
        return { url: response.url, redirect: response.redirect }
      },
    )
  }
}
