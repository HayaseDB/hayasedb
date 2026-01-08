import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Pagination } from 'nestjs-typeorm-paginate';

import { ActiveUser } from '../../common/decorators/active-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../rbac/decorators/public.decorator';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { User } from '../users/entities/user.entity';
import { ContributionsService } from './contributions.service';
import { ContributionResponseDto } from './dto/contribution-response.dto';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { PaginatedContributionResponseDto } from './dto/paginated-contribution-response.dto';
import { QueryContributionsDto } from './dto/query-contributions.dto';
import { ResolveContributionDto } from './dto/resolve-contribution.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';
import { Contribution } from './entities/contribution.entity';
import { EntityType } from './enums/entity-type.enum';
import { SchemaGeneratorService } from './schema/schema-generator.service';
import type { JSONSchema7 } from './schema/types/json-schema.types';

@ApiTags('Contributions')
@Controller('contributions')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access_token')
export class ContributionsController {
  constructor(
    private readonly contributionsService: ContributionsService,
    private readonly schemaGeneratorService: SchemaGeneratorService,
  ) {}

  @Post()
  @Permissions(['global:contributions.create:own'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create contribution',
    description: 'Create a new contribution draft for an entity',
  })
  @ApiCreatedResponse({
    description: 'Contribution created successfully',
    type: ContributionResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid entity type or target ID',
  })
  async create(
    @Body() createContributionDto: CreateContributionDto,
    @ActiveUser() user: User,
  ): Promise<Contribution> {
    return this.contributionsService.create(createContributionDto, user);
  }

  @Get()
  @Permissions(['global:contributions.read:own'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List own contributions',
    description: 'Get a paginated list of your own contributions',
  })
  @ApiOkResponse({
    description: 'Contributions retrieved successfully',
    type: PaginatedContributionResponseDto,
  })
  async findOwn(
    @Query() query: QueryContributionsDto,
    @ActiveUser() user: User,
  ): Promise<Pagination<Contribution>> {
    return this.contributionsService.findOwn(user.id, query);
  }

  @Get('queue')
  @Permissions(['global:contributions.review:any'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get pending queue',
    description:
      'Get a paginated list of pending contributions awaiting review (Moderator only)',
  })
  @ApiOkResponse({
    description: 'Pending contributions retrieved successfully',
    type: PaginatedContributionResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async findQueue(
    @Query() query: QueryContributionsDto,
  ): Promise<Pagination<Contribution>> {
    return this.contributionsService.findQueue(query);
  }

  @Get('schema/:target')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get contribution schema',
    description:
      'Returns JSON Schema for the specified entity type, describing all valid fields and their constraints for contributions. Use this to auto-generate forms.',
  })
  @ApiParam({
    name: 'target',
    description: 'Target entity type',
    enum: EntityType,
    example: EntityType.ANIME,
  })
  @ApiOkResponse({
    description: 'Schema retrieved successfully',
  })
  getSchema(
    @Param('target', new ParseEnumPipe(EntityType)) target: EntityType,
  ): JSONSchema7 {
    return this.schemaGeneratorService.generateSchema(target);
  }

  @Get(':id')
  @Permissions(['global:contributions.read:own'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get contribution',
    description:
      'Get a single contribution by ID (own contributions or any for moderators)',
  })
  @ApiParam({
    name: 'id',
    description: 'Contribution ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Contribution retrieved successfully',
    type: ContributionResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Contribution not found (CONTRIBUTION_NOT_FOUND)',
  })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Contribution> {
    return this.contributionsService.getById(id);
  }

  @Put(':id')
  @Permissions(['global:contributions.update:own'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update contribution',
    description: 'Update an existing contribution draft (replaces data)',
  })
  @ApiParam({
    name: 'id',
    description: 'Contribution ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Contribution updated successfully',
    type: ContributionResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Contribution not found (CONTRIBUTION_NOT_FOUND)',
  })
  @ApiForbiddenResponse({ description: 'Not owner (CONTRIBUTION_NOT_OWNER)' })
  @ApiUnprocessableEntityResponse({
    description: 'Not in draft status (CONTRIBUTION_NOT_DRAFT)',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContributionDto: UpdateContributionDto,
    @ActiveUser() user: User,
  ): Promise<Contribution> {
    return this.contributionsService.update(id, updateContributionDto, user);
  }

  @Delete(':id')
  @Permissions(['global:contributions.delete:own'])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete/withdraw contribution',
    description: 'Delete a draft contribution or withdraw a pending one',
  })
  @ApiParam({
    name: 'id',
    description: 'Contribution ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiNoContentResponse({
    description: 'Contribution deleted/withdrawn successfully',
  })
  @ApiNotFoundResponse({
    description: 'Contribution not found (CONTRIBUTION_NOT_FOUND)',
  })
  @ApiForbiddenResponse({ description: 'Not owner (CONTRIBUTION_NOT_OWNER)' })
  @ApiUnprocessableEntityResponse({
    description: 'Cannot delete approved/rejected contributions',
  })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @ActiveUser() user: User,
  ): Promise<void> {
    await this.contributionsService.delete(id, user);
  }

  @Post(':id/submit')
  @Permissions(['global:contributions.update:own'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit contribution',
    description: 'Submit a draft contribution for review',
  })
  @ApiParam({
    name: 'id',
    description: 'Contribution ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Contribution submitted successfully',
    type: ContributionResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Contribution not found (CONTRIBUTION_NOT_FOUND)',
  })
  @ApiForbiddenResponse({ description: 'Not owner (CONTRIBUTION_NOT_OWNER)' })
  @ApiUnprocessableEntityResponse({
    description: 'Not in draft status or validation failed',
  })
  async submit(
    @Param('id', ParseUUIDPipe) id: string,
    @ActiveUser() user: User,
  ): Promise<Contribution> {
    return this.contributionsService.submit(id, user);
  }

  @Post(':id/approve')
  @Permissions(['global:contributions.review:any'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve contribution',
    description:
      'Approve a pending contribution and apply changes (Moderator only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Contribution ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Contribution approved successfully',
    type: ContributionResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Contribution not found (CONTRIBUTION_NOT_FOUND)',
  })
  @ApiForbiddenResponse({
    description: 'Cannot self-review (CONTRIBUTION_SELF_REVIEW)',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Not pending or validation failed',
  })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @ActiveUser() user: User,
  ): Promise<Contribution> {
    return this.contributionsService.approve(id, user);
  }

  @Post(':id/reject')
  @Permissions(['global:contributions.review:any'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject contribution',
    description:
      'Reject a pending contribution with a required note (Moderator only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Contribution ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Contribution rejected successfully',
    type: ContributionResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Contribution not found (CONTRIBUTION_NOT_FOUND)',
  })
  @ApiForbiddenResponse({
    description: 'Cannot self-review (CONTRIBUTION_SELF_REVIEW)',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Not pending or note required',
  })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resolveDto: ResolveContributionDto,
    @ActiveUser() user: User,
  ): Promise<Contribution> {
    return this.contributionsService.reject(id, user, resolveDto.note ?? '');
  }
}
