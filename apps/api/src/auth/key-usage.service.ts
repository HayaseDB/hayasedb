import { Inject, Injectable } from '@nestjs/common'
import { REDIS } from '../redis/redis.constants'
import type { Redis } from '../redis/redis.factory'
import { KeyLimitCache } from './key-limit-cache'

const HIT_PREFIX = 'throttle:hits'
const THROTTLER_NAME = 'default'

export interface KeyUsage {
  used: number
  limit: number | null
  remaining: number | null
  windowMs: number
  resetsAt: Date | null
}

@Injectable()
export class KeyUsageService {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly keyLimits: KeyLimitCache,
  ) {}

  async forKeyId(
    keyId: string,
    configured: { max: number | null; windowMs: number },
  ): Promise<KeyUsage> {
    const idle: KeyUsage = {
      used: 0,
      limit: configured.max,
      remaining: configured.max,
      windowMs: configured.windowMs,
      resetsAt: null,
    }

    const print = await this.keyLimits.fingerprintOf(keyId)
    if (!print) return idle

    const hitKey = `${HIT_PREFIX}:${THROTTLER_NAME}:key:${print}`
    const [raw, ttl] = await Promise.all([
      this.redis.get(hitKey),
      this.redis.pttl(hitKey),
    ])

    const used = Number(raw)
    if (!raw || !Number.isFinite(used)) return idle

    return {
      used,
      limit: configured.max,
      remaining:
        configured.max === null ? null : Math.max(0, configured.max - used),
      windowMs: configured.windowMs,
      resetsAt: ttl > 0 ? new Date(Date.now() + ttl) : null,
    }
  }
}
