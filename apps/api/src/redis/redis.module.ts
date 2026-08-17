import { Global, Module } from '@nestjs/common'
import { REDIS } from './redis.constants'
import { RedisLifecycle, redisProvider } from './redis.providers'
import { RedisThrottlerStorage } from './throttler-storage'

@Global()
@Module({
  providers: [redisProvider, RedisLifecycle, RedisThrottlerStorage],
  exports: [REDIS, RedisThrottlerStorage],
})
export class RedisModule {}
