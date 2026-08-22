import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminFacade } from './admin.service'
import { ApiKeyController } from './api-key.controller'
import { ApiKeyFacade } from './api-key.service'
import { AuthController } from './auth.controller'
import { AuthFacade } from './auth.service'
import { OAuthController } from './oauth.controller'
import { UserController } from './user.controller'

@Module({
  controllers: [
    AuthController,
    UserController,
    AdminController,
    ApiKeyController,
    OAuthController,
  ],
  providers: [AuthFacade, AdminFacade, ApiKeyFacade],
})
export class AuthApiModule {}
