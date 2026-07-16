import { Module } from '@nestjs/common'
import { UserRefService } from './user-ref.service'

@Module({
  providers: [UserRefService],
  exports: [UserRefService],
})
export class UserModule {}
