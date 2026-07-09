import { Module } from '@nestjs/common'
import { StorageModule } from '../../storage/storage.module'
import { AccountController } from './account.controller'
import { AvatarService } from './avatar.service'

@Module({
  imports: [StorageModule],
  controllers: [AccountController],
  providers: [AvatarService],
})
export class AccountModule {}
