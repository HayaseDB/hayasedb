import { setTimeout as delay } from 'node:timers/promises'
import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import type Redis from 'ioredis'
import type postgres from 'postgres'
import { DATABASE_CLIENT } from '../../database/database.constants'
import { REDIS } from '../../redis/redis.constants'

const PROBE_TIMEOUT_MS = 2_000

@Controller()
export class HealthController {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly db: postgres.Sql,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @AllowAnonymous()
  @Get('health')
  health() {
    return { status: 'ok' as const, ts: Date.now() }
  }

  @AllowAnonymous()
  @Get('ready')
  async ready() {
    const [database, redis] = await Promise.all([
      this.probe(() => this.db`SELECT 1`),
      this.probe(() => this.redis.ping()),
    ])

    const checks = {
      database: database ? 'ok' : 'fail',
      redis: redis ? 'ok' : 'fail',
    } as const

    if (!database || !redis) {
      throw new ServiceUnavailableException({ status: 'unavailable', checks })
    }

    return { status: 'ok' as const, checks, ts: Date.now() }
  }

  private async probe(check: () => Promise<unknown>): Promise<boolean> {
    const controller = new AbortController()
    try {
      await Promise.race([
        check(),
        delay(PROBE_TIMEOUT_MS, undefined, { signal: controller.signal }).then(
          () => {
            throw new Error('probe timed out')
          },
        ),
      ])
      return true
    } catch {
      return false
    } finally {
      controller.abort()
    }
  }
}
