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
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Pagination } from 'nestjs-typeorm-paginate';

import { ActiveSession } from '../../common/decorators/active-session.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { User } from '../users/entities/user.entity';
import { PaginatedSessionResponseDto } from './dto/paginated-session-response.dto';
import { SessionQueryDto } from './dto/session-query.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { Session } from './entities/session.entity';
import { SessionsService } from './sessions.service';

@ApiTags('Sessions')
@Controller('sessions')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access_token')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @Permissions(['global:sessions.read:own'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List user sessions',
    description: 'Get a paginated list of sessions for the authenticated user',
  })
  @ApiOkResponse({
    description: 'Sessions retrieved successfully',
    type: PaginatedSessionResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async findAll(
    @Query() query: SessionQueryDto,
    @ActiveUser() user: User,
    @ActiveSession() currentSession: Session,
  ): Promise<Pagination<SessionResponseDto>> {
    const result = await this.sessionsService.findByUserIdPaginated(
      user.id,
      query,
    );

    const transformedItems = result.items.map((session) => ({
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

    return {
      items: transformedItems,
      meta: result.meta,
      links: result.links,
    };
  }

  @Get(':id')
  @Permissions(['global:sessions.read:own'])
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
  @Permissions(['global:sessions.delete:own'])
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
  @Permissions(['global:sessions.delete:own'])
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
