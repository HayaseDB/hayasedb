import {
  Inject,
  Injectable,
  type OnApplicationShutdown,
  type Provider,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { type Redis, createRedis } from '@hayasedb/core'
import type { Env } from '../config/env.schema'
import { REDIS } from './redis.constants'

export const redisProvider: Provider = {
  provide: REDIS,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>): Redis =>
    createRedis(config.get('REDIS_URL', { infer: true })),
}

@Injectable()
export class RedisLifecycle implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly client: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit()
  }
}
