import { Injectable } from '@nestjs/common'
import { AuthService as BetterAuthService } from '@thallesp/nestjs-better-auth'
import type { ApiKey } from '@hayasedb/contract'
import type { Request } from 'express'
import type { Auth } from '../../auth/auth'
import { KeyLimitCache } from '../../auth/key-limit-cache'
import { KeyUsageService } from '../../auth/key-usage.service'
import { BetterAuthFacade } from './better-auth-facade'
import type { AuthBody } from './auth-api.types'

const DEFAULT_WINDOW_MS = 60_000
const DEFAULT_MAX = 60

interface RawApiKey {
  id: string
  name: string | null
  start: string | null
  prefix: string | null
  enabled: boolean
  rateLimitEnabled: boolean
  rateLimitMax: number | null
  rateLimitTimeWindow: number | null
  lastRequest: Date | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const toApiKey = (key: RawApiKey): ApiKey => ({
  id: key.id,
  name: key.name,
  start: key.start,
  prefix: key.prefix,
  enabled: key.enabled,
  rateLimit: {
    enabled: true,
    max: key.rateLimitMax ?? DEFAULT_MAX,
    windowMs: key.rateLimitTimeWindow ?? DEFAULT_WINDOW_MS,
  },
  lastRequest: key.lastRequest,
  expiresAt: key.expiresAt,
  createdAt: key.createdAt,
  updatedAt: key.updatedAt,
})

@Injectable()
export class ApiKeyFacade extends BetterAuthFacade {
  constructor(
    auth: BetterAuthService<Auth>,
    private readonly usage: KeyUsageService,
    private readonly keyLimits: KeyLimitCache,
  ) {
    super(auth)
  }

  async create(request: Request, body: AuthBody<'createApiKey'>) {
    const created = await this.api.createApiKey({
      body,
      headers: this.headers(request),
    })
    return { ...toApiKey(created as RawApiKey), key: created.key }
  }

  async list(request: Request) {
    const { apiKeys } = await this.api.listApiKeys({
      headers: this.headers(request),
    })

    const items = await Promise.all(
      (apiKeys as RawApiKey[]).map(async (raw) => {
        const key = toApiKey(raw)
        const usage = await this.usage.forKeyId(key.id, {
          max: key.rateLimit.max,
          windowMs: key.rateLimit.windowMs,
        })
        return { ...key, usage }
      }),
    )

    return { items, meta: { total: items.length } }
  }

  async delete(request: Request, keyId: string) {
    const result = await this.api.deleteApiKey({
      body: { keyId },
      headers: this.headers(request),
    })
    await this.keyLimits.invalidateById(keyId)
    return result
  }
}
