import { Global, Module } from '@nestjs/common';

import { RbacGuard } from './guards/rbac.guard';
import { RbacMatrixController } from './rbac-matrix.controller';
import { RbacMatrixService } from './rbac-matrix.service';
import { RbacService } from './rbac.service';

@Global()
@Module({
  controllers: [RbacMatrixController],
  providers: [RbacService, RbacMatrixService, RbacGuard],
  exports: [RbacService, RbacMatrixService, RbacGuard],
})
export class RbacModule {}
