import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { contract } from '@hayasedb/contract'
import type { Request } from 'express'
import { forwardSetCookie } from '../../orpc/forward-set-cookie'
import type { CallbackParams } from './auth-api.types'
import { AuthFacade } from './auth.service'

@Controller()
export class OAuthController {
  constructor(private readonly auth: AuthFacade) {}

  @AllowAnonymous()
  @Implement(contract.auth.callback.get)
  callbackGet() {
    return implement(contract.auth.callback.get).handler(({ input, context }) =>
      this.callback(context.request, input.params, input.query),
    )
  }

  @AllowAnonymous()
  @Implement(contract.auth.callback.post)
  callbackPost() {
    return implement(contract.auth.callback.post).handler(
      ({ input, context }) =>
        this.callback(context.request, input.params, input.query, input.body),
    )
  }

  private async callback(
    request: Request,
    params: { id: string },
    query: CallbackParams,
    body?: CallbackParams,
  ) {
    const response = await this.auth.callbackOAuth(request, params, query, body)

    forwardSetCookie(request, response.headers)

    return {
      headers: { location: response.headers.get('location') ?? '/' },
    }
  }
}
