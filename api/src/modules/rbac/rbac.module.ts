import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { RbacGuard } from './guards/rbac.guard';
import { RbacService } from './rbac.service';

@Global()
@Module({
  providers: [
    RbacService,
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
  ],
  exports: [RbacService],
})
export class RbacModule {}
