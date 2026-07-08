import {
  Inject,
  Injectable,
  type OnApplicationShutdown,
  type Provider,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Env } from '../config/env.schema'
import { REDIS } from './redis.constants'
import { type Redis, createRedis } from './redis.factory'

export const redisProvider: Provider = {
  provide: REDIS,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>): Redis =>
    createRedis({
      host: config.get('REDIS_HOST', { infer: true }),
      port: config.get('REDIS_PORT', { infer: true }),
    }),
}

@Injectable()
export class RedisLifecycle implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly client: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit()
  }
}
