import { Injectable } from '@nestjs/common'
import { AuthService as BetterAuthService } from '@thallesp/nestjs-better-auth'
import { fromNodeHeaders } from 'better-auth/node'
import type { Request } from 'express'
import type { Auth } from '../../auth/auth'
import type { AuthApi } from './auth-api.types'

@Injectable()
export abstract class BetterAuthFacade {
  constructor(private readonly auth: BetterAuthService<Auth>) {}

  protected get api(): AuthApi {
    return this.auth.api
  }

  protected headers(request: Request): Headers {
    return fromNodeHeaders(request.headers)
  }
}
