import { createHash } from 'node:crypto'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import type { Database } from '@hayasedb/db'
import { tables } from '@hayasedb/db'
import { DRIZZLE } from '../database/database.constants'
import { REDIS } from '../redis/redis.constants'
import type { Redis } from '../redis/redis.factory'

const PREFIX = 'apikey:limit'
const PRINT_PREFIX = 'apikey:print'
const TTL_SECONDS = 300

export const fingerprint = (value: string) =>
  createHash('sha256').update(value).digest('hex').slice(0, 32)

export const hashApiKey = (value: string) =>
  createHash('sha256').update(value).digest('base64url')

export interface KeyLimit {
  max: number | null
  windowMs: number
}

@Injectable()
export class KeyLimitCache {
  private readonly logger = new Logger(KeyLimitCache.name)

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  private cacheKey(print: string) {
    return `${PREFIX}:${print}`
  }

  private printKey(keyId: string) {
    return `${PRINT_PREFIX}:${keyId}`
  }

  async get(rawKey: string): Promise<KeyLimit | undefined> {
    const cached = await this.redis.get(this.cacheKey(fingerprint(rawKey)))
    if (!cached) return undefined
    try {
      return JSON.parse(cached) as KeyLimit
    } catch {
      return undefined
    }
  }

  async set(rawKey: string, limit: KeyLimit): Promise<void> {
    await this.redis.set(
      this.cacheKey(fingerprint(rawKey)),
      JSON.stringify(limit),
      'EX',
      TTL_SECONDS,
    )
  }

  async fingerprintOf(keyId: string): Promise<string | undefined> {
    return (await this.redis.get(this.printKey(keyId))) ?? undefined
  }

  async invalidateById(keyId: string): Promise<void> {
    const print = await this.fingerprintOf(keyId)
    await this.redis.del(
      ...(print ? [this.cacheKey(print)] : []),
      this.printKey(keyId),
    )
  }

  async refresh(rawKey: string): Promise<void> {
    try {
      const [row] = await this.db
        .select({
          id: tables.apikey.id,
          max: tables.apikey.rateLimitMax,
          windowMs: tables.apikey.rateLimitTimeWindow,
        })
        .from(tables.apikey)
        .where(eq(tables.apikey.key, hashApiKey(rawKey)))
        .limit(1)

      if (!row) return

      const print = fingerprint(rawKey)
      await Promise.all([
        this.set(rawKey, {
          max: row.max ?? null,
          windowMs: row.windowMs ?? 60_000,
        }),
        this.redis.set(this.printKey(row.id), print, 'EX', TTL_SECONDS * 12),
      ])
    } catch (error) {
      this.logger.warn(
        `Failed to refresh API key rate limit: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }
}
