import { Injectable } from '@nestjs/common'
import type { Request } from 'express'
import { BetterAuthFacade } from './better-auth-facade'
import type { AuthBody } from './auth-api.types'

@Injectable()
export class ApiKeyFacade extends BetterAuthFacade {
  create(request: Request, body: AuthBody<'createApiKey'>) {
    return this.api.createApiKey({ body, headers: this.headers(request) })
  }

  async list(request: Request) {
    const { apiKeys } = await this.api.listApiKeys({
      headers: this.headers(request),
    })
    return apiKeys
  }

  delete(request: Request, keyId: string) {
    return this.api.deleteApiKey({
      body: { keyId },
      headers: this.headers(request),
    })
  }
}
