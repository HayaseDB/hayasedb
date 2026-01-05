import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { Permission } from '../rbac/decorators/permission.decorator';
import { Public } from '../rbac/decorators/public.decorator';
import { RbacGuard } from '../rbac/guards/rbac.guard';
import { User } from '../users/entities/user.entity';
import { CreateGenreDto } from './dto/create-genre.dto';
import { GenreQueryDto } from './dto/genre-query.dto';
import { GenreResponseDto } from './dto/genre-response.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { Genre } from './entities/genre.entity';
import { GenresService } from './genres.service';

@ApiTags('Genres')
@Controller('genres')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth('access_token')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List genres',
    description:
      'Get a paginated list of genres with optional filtering and sorting',
  })
  @ApiOkResponse({
    description: 'Genres retrieved successfully',
  })
  async findAll(@Query() query: GenreQueryDto): Promise<Pagination<Genre>> {
    return this.genresService.findAll(query);
  }

  @Get(':slug')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get genre by slug',
    description: 'Get a single genre by its URL-friendly slug',
  })
  @ApiParam({
    name: 'slug',
    description: 'Genre slug',
    type: 'string',
    example: 'comedy',
  })
  @ApiOkResponse({
    description: 'Genre retrieved successfully',
    type: GenreResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Genre not found (GENRE_NOT_FOUND)' })
  async findBySlug(@Param('slug') slug: string): Promise<Genre> {
    return this.genresService.findBySlug(slug);
  }

  @Post()
  @Permission(['genres@create:any'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create genre',
    description: 'Create a new genre entry (Moderator only)',
  })
  @ApiCreatedResponse({
    description: 'Genre created successfully',
    type: GenreResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async create(
    @Body() createGenreDto: CreateGenreDto,
    @ActiveUser() user: User,
  ): Promise<Genre> {
    return this.genresService.create(createGenreDto, user);
  }

  @Patch(':id')
  @Permission(['genres@update:any'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update genre',
    description: 'Update an existing genre entry (Moderator only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Genre ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Genre updated successfully',
    type: GenreResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Genre not found (GENRE_NOT_FOUND)' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGenreDto: UpdateGenreDto,
  ): Promise<Genre> {
    return this.genresService.update(id, updateGenreDto);
  }

  @Delete(':id')
  @Permission(['genres@delete:any'])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete genre',
    description: 'Soft delete a genre entry (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Genre ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiNoContentResponse({
    description: 'Genre deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Genre not found (GENRE_NOT_FOUND)' })
  @ApiUnprocessableEntityResponse({
    description: 'Genre already deleted (GENRE_ALREADY_DELETED)',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.genresService.softDelete(id);
  }

  @Post(':id/restore')
  @Permission(['genres@update:any'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore genre',
    description: 'Restore a soft-deleted genre entry (Moderator only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Genre ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Genre restored successfully',
    type: GenreResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Genre not found (GENRE_NOT_FOUND)' })
  @ApiUnprocessableEntityResponse({
    description: 'Genre not deleted (GENRE_NOT_DELETED)',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<Genre> {
    return this.genresService.restore(id);
  }
}
