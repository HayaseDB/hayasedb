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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';
import { Pagination } from 'nestjs-typeorm-paginate';

import { Media } from '../media/entities/media.entity';
import { MediaResponseDto } from '../media/dto/media-response.dto';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Public } from '../rbac/decorators/public.decorator';
import { AnimesService } from './animes.service';
import {
  ANIME_COVER_ALLOWED_MIME_TYPES,
  ANIME_COVER_MAX_SIZE,
} from './constants/anime-cover.constants';
import { AnimeQueryDto } from './dto/anime-query.dto';
import { AnimeResponseDto } from './dto/anime-response.dto';
import { CreateAnimeDto } from './dto/create-anime.dto';
import { PaginatedAnimeResponseDto } from './dto/paginated-anime-response.dto';
import { UpdateAnimeDto } from './dto/update-anime.dto';
import { Anime } from './entities/anime.entity';
import { AnimeCoverValidationPipe } from './pipes/anime-cover-validation.pipe';

@ApiTags('Animes')
@Controller('animes')
@UseInterceptors(ClassSerializerInterceptor)
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

  @Post('covers')
  @Permissions(['global:contributions.create:own'])
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: ANIME_COVER_MAX_SIZE,
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload anime cover',
    description:
      'Upload an anime cover image. Returns a Media object to reference in contributions.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: `Cover image (max ${ANIME_COVER_MAX_SIZE / (1024 * 1024)}MB, allowed: ${ANIME_COVER_ALLOWED_MIME_TYPES.join(', ')})`,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Cover uploaded successfully',
    type: MediaResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Cover image file is required' })
  @ApiPayloadTooLargeResponse({ description: 'File size exceeds maximum' })
  @ApiUnsupportedMediaTypeResponse({ description: 'Invalid file type' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async uploadCover(
    @UploadedFile(AnimeCoverValidationPipe) file: Express.Multer.File,
  ): Promise<Media> {
    return this.animesService.uploadCover(file);
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
