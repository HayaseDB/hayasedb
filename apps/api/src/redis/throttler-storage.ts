import { Inject, Injectable } from '@nestjs/common'
import type { ThrottlerStorage } from '@nestjs/throttler'
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface'
import { REDIS } from './redis.constants'
import type { Redis } from './redis.factory'

const HIT_PREFIX = 'throttle:hits'
const BLOCK_PREFIX = 'throttle:block'

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitKey = `${HIT_PREFIX}:${throttlerName}:${key}`
    const blockKey = `${BLOCK_PREFIX}:${throttlerName}:${key}`

    const blockTtl = await this.redis.pttl(blockKey)
    if (blockTtl > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: Math.ceil(blockTtl / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockTtl / 1000),
      }
    }

    const [[, totalHits], , [, hitTtl]] = (await this.redis
      .multi()
      .incr(hitKey)
      .pexpire(hitKey, ttl, 'NX')
      .pttl(hitKey)
      .exec()) as [[null, number], [null, number], [null, number]]

    if (totalHits > limit) {
      await this.redis.set(blockKey, '1', 'PX', blockDuration, 'NX')
      const activeBlock = await this.redis.pttl(blockKey)
      const remaining = activeBlock > 0 ? activeBlock : blockDuration
      return {
        totalHits,
        timeToExpire: Math.ceil(remaining / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(remaining / 1000),
      }
    }

    return {
      totalHits,
      timeToExpire: Math.ceil(Math.max(hitTtl, 0) / 1000),
      isBlocked: false,
      timeToBlockExpire: 0,
    }
  }
}
