import {
  ClassSerializerInterceptor,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ActiveSession } from '../../common/decorators/active-session.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import { RbacGuard } from '../rbac/guards/rbac.guard';
import { User } from '../users/entities/user.entity';
import { SessionResponseDto } from './dto/session-response.dto';
import { Session } from './entities/session.entity';
import { SessionsService } from './sessions.service';

@ApiTags('Sessions')
@Controller('sessions')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth('access_token')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @Permission(['sessions@read:own'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List user sessions',
    description: 'Get all sessions for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Sessions retrieved successfully',
    type: [SessionResponseDto],
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async findAll(
    @ActiveUser() user: User,
    @ActiveSession() currentSession: Session,
  ): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionsService.findByUserId(user.id);

    return sessions.map((session) => ({
      id: session.id,
      browser: session.browser,
      browserVersion: session.browserVersion,
      os: session.os,
      osVersion: session.osVersion,
      deviceType: session.deviceType,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      isCurrent: session.id === currentSession.id,
    }));
  }

  @Get(':id')
  @Permission(['sessions@read:own'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get session by ID',
    description: 'Get a specific session belonging to the authenticated user',
  })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Session retrieved successfully',
    type: SessionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @ActiveUser() user: User,
    @ActiveSession() currentSession: Session,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionsService.findById(id);

    if (!session || session.user.id !== user.id) {
      throw new NotFoundException('Session not found');
    }

    return {
      id: session.id,
      browser: session.browser,
      browserVersion: session.browserVersion,
      os: session.os,
      osVersion: session.osVersion,
      deviceType: session.deviceType,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      isCurrent: session.id === currentSession.id,
    };
  }

  @Delete('others')
  @Permission(['sessions@delete:own'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke all other sessions',
    description: 'Revoke all sessions except the current one',
  })
  @ApiResponse({
    status: 200,
    description: 'Other sessions revoked successfully',
    schema: {
      type: 'object',
      properties: {
        revokedCount: {
          type: 'number',
          description: 'Number of sessions revoked',
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async removeOthers(
    @ActiveUser() user: User,
    @ActiveSession() currentSession: Session,
  ): Promise<{ revokedCount: number }> {
    const revokedCount = await this.sessionsService.deleteAllExceptCurrent(
      user.id,
      currentSession.id,
    );
    return { revokedCount };
  }

  @Delete(':id')
  @Permission(['sessions@delete:own'])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revoke session',
    description:
      'Revoke/delete a specific session. Cannot revoke current session.',
  })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Session revoked successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot revoke current session or insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @ActiveUser() user: User,
    @ActiveSession() currentSession: Session,
  ): Promise<void> {
    const session = await this.sessionsService.findById(id);

    if (!session || session.user.id !== user.id) {
      throw new NotFoundException('Session not found');
    }

    if (session.id === currentSession.id) {
      throw new ForbiddenException('Cannot revoke current session');
    }

    await this.sessionsService.deleteById(id);
  }
}
