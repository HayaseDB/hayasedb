import { Global, Module } from '@nestjs/common'
import { KeyLimitCache } from './key-limit-cache'
import { KeyUsageService } from './key-usage.service'

@Global()
@Module({
  providers: [KeyLimitCache, KeyUsageService],
  exports: [KeyLimitCache, KeyUsageService],
})
export class KeyLimitModule {}
