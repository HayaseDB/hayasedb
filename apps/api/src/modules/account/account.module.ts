import { Module } from '@nestjs/common'
import { MediaModule } from '../media/media.module'
import { AccountController } from './account.controller'
import { AvatarService } from './avatar.service'

@Module({
  imports: [MediaModule],
  controllers: [AccountController],
  providers: [AvatarService],
})
export class AccountModule {}
