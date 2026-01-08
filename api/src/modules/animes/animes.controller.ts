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

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../rbac/decorators/public.decorator';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { AnimesService } from './animes.service';
import { AnimeQueryDto } from './dto/anime-query.dto';
import { AnimeResponseDto } from './dto/anime-response.dto';
import { CreateAnimeDto } from './dto/create-anime.dto';
import { PaginatedAnimeResponseDto } from './dto/paginated-anime-response.dto';
import { UpdateAnimeDto } from './dto/update-anime.dto';
import { Anime } from './entities/anime.entity';

@ApiTags('Animes')
@Controller('animes')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access_token')
export class AnimesController {
  constructor(private readonly animesService: AnimesService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List animes',
    description:
      'Get a paginated list of animes with optional filtering and sorting',
  })
  @ApiOkResponse({
    description: 'Animes retrieved successfully',
    type: PaginatedAnimeResponseDto,
  })
  async findAll(@Query() query: AnimeQueryDto): Promise<Pagination<Anime>> {
    return this.animesService.findAll(query);
  }

  @Get(':slug')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get anime by slug',
    description: 'Get a single anime by its URL-friendly slug',
  })
  @ApiParam({
    name: 'slug',
    description: 'Anime slug',
    type: 'string',
    example: 'dont-toy-with-me-miss-nagatoro',
  })
  @ApiOkResponse({
    description: 'Anime retrieved successfully',
    type: AnimeResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Anime not found (ANIME_NOT_FOUND)' })
  async findBySlug(@Param('slug') slug: string): Promise<Anime> {
    return this.animesService.findBySlug(slug);
  }

  @Post()
  @Permissions(['global:animes.create'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create anime',
    description: 'Create a new anime entry (Admin only)',
  })
  @ApiCreatedResponse({
    description: 'Anime created successfully',
    type: AnimeResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async create(@Body() createAnimeDto: CreateAnimeDto): Promise<Anime> {
    return this.animesService.create(createAnimeDto);
  }

  @Patch(':id')
  @Permissions(['global:animes.update'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update anime',
    description: 'Update an existing anime entry (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Anime ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Anime updated successfully',
    type: AnimeResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Anime not found (ANIME_NOT_FOUND)' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAnimeDto: UpdateAnimeDto,
  ): Promise<Anime> {
    return this.animesService.update(id, updateAnimeDto);
  }

  @Delete(':id')
  @Permissions(['global:animes.delete'])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete anime',
    description: 'Soft delete an anime entry (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Anime ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiNoContentResponse({
    description: 'Anime deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Anime not found (ANIME_NOT_FOUND)' })
  @ApiUnprocessableEntityResponse({
    description: 'Anime already deleted (ANIME_ALREADY_DELETED)',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.animesService.softDelete(id);
  }

  @Post(':id/restore')
  @Permissions(['global:animes.update'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore anime',
    description: 'Restore a soft-deleted anime entry (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Anime ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Anime restored successfully',
    type: AnimeResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Anime not found (ANIME_NOT_FOUND)' })
  @ApiUnprocessableEntityResponse({
    description: 'Anime not deleted (ANIME_NOT_DELETED)',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<Anime> {
    return this.animesService.restore(id);
  }
}
