import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permission } from './decorators/permission.decorator';
import { RbacGuard } from './guards/rbac.guard';
import type { RbacMatrix } from './rbac-matrix.service';
import { RbacMatrixService } from './rbac-matrix.service';

@ApiTags('RBAC')
@Controller('rbac')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth('access_token')
export class RbacMatrixController {
  constructor(private readonly rbacMatrixService: RbacMatrixService) {}

  @Get('matrix')
  @Permission(['rbac@read:any'])
  @ApiOperation({
    summary: 'Get RBAC permission matrix',
    description:
      'Returns a matrix of all permissions and which roles have them. Administrator only.',
  })
  @ApiResponse({
    status: 200,
    description: 'RBAC matrix retrieved successfully',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
  })
  getMatrix(): RbacMatrix {
    return this.rbacMatrixService.generateMatrix();
  }
}
