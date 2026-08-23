import { Module } from '@nestjs/common'
import { AuthApiModule } from '../auth/auth.module'
import { MediaModule } from '../media/media.module'
import { AccountController } from './account.controller'
import { AvatarService } from './avatar.service'

@Module({
  imports: [MediaModule, AuthApiModule],
  controllers: [AccountController],
  providers: [AvatarService],
})
export class AccountModule {}
