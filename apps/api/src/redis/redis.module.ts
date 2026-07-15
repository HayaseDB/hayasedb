import { Global, Module } from '@nestjs/common'
import { REDIS } from './redis.constants'
import { RedisLifecycle, redisProvider } from './redis.providers'

@Global()
@Module({
  providers: [redisProvider, RedisLifecycle],
  exports: [REDIS],
})
export class RedisModule {}
