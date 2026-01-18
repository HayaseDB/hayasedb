import { randomUUID } from 'node:crypto';

import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import sharp from 'sharp';
import { DataSource, Repository } from 'typeorm';

import { StorageService } from '../../storage/storage.service';
import { GenresService } from '../genres/genres.service';
import { Media } from '../media/entities/media.entity';
import { CreateMediaInput, MediaService } from '../media/media.service';
import {
  ANIME_COVER_BUCKET,
  ANIME_COVER_OUTPUT_HEIGHT,
  ANIME_COVER_OUTPUT_WIDTH,
} from './constants/anime-cover.constants';
import {
  AnimeQueryDto,
  AnimeSortField,
  SortOrder,
} from './dto/anime-query.dto';
import { CreateAnimeDto } from './dto/create-anime.dto';
import { UpdateAnimeDto } from './dto/update-anime.dto';
import { Anime } from './entities/anime.entity';

@Injectable()
export class AnimesService {
  private readonly logger = new Logger(AnimesService.name);

  constructor(
    @InjectRepository(Anime)
    private readonly animeRepository: Repository<Anime>,
    @Inject(forwardRef(() => GenresService))
    private readonly genresService: GenresService,
    private readonly dataSource: DataSource,
    private readonly storageService: StorageService,
    private readonly mediaService: MediaService,
  ) {}

  async create(createAnimeDto: CreateAnimeDto): Promise<Anime> {
    return this.dataSource.transaction(async (manager) => {
      const { genres: genreIds, ...animeData } = createAnimeDto;

      const genres = genreIds?.length
        ? await this.genresService.findByIds(genreIds)
        : [];

      const anime = manager.create(Anime, {
        ...animeData,
        genres,
      });

      const savedAnime = await manager.save(anime);
      this.logger.log(`Anime created: ${savedAnime.id} (${savedAnime.slug})`);
      return savedAnime;
    });
  }

  async findAll(query: AnimeQueryDto): Promise<Pagination<Anime>> {
    const {
      page = 1,
      limit = 20,
      search,
      format,
      status,
      year,
      sort = AnimeSortField.CREATED_AT,
      order = SortOrder.DESC,
    } = query;

    const queryBuilder = this.animeRepository
      .createQueryBuilder('anime')
      .leftJoinAndSelect('anime.genres', 'genres');

    if (search) {
      queryBuilder.andWhere('anime.title ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (format) {
      queryBuilder.andWhere('anime.format = :format', { format });
    }

    if (status) {
      queryBuilder.andWhere('anime.status = :status', { status });
    }

    if (year) {
      queryBuilder.andWhere('anime.year = :year', { year });
    }

    const sortField = this.getSortField(sort);
    const sortOrder = order === SortOrder.ASC ? 'ASC' : 'DESC';
    queryBuilder.orderBy(sortField, sortOrder);

    return paginate<Anime>(queryBuilder, { page, limit, route: '/animes' });
  }

  async findBySlug(slug: string): Promise<Anime> {
    const anime = await this.animeRepository.findOne({
      where: { slug },
      relations: ['genres'],
    });

    if (!anime) {
      throw new NotFoundException({
        code: 'ANIME_NOT_FOUND',
        message: `Anime with slug "${slug}" not found`,
      });
    }

    return anime;
  }

  async findById(id: string): Promise<Anime> {
    const anime = await this.animeRepository.findOne({
      where: { id },
      relations: ['genres'],
    });

    if (!anime) {
      throw new NotFoundException({
        code: 'ANIME_NOT_FOUND',
        message: `Anime with ID "${id}" not found`,
      });
    }

    return anime;
  }

  async update(id: string, updateAnimeDto: UpdateAnimeDto): Promise<Anime> {
    return this.dataSource.transaction(async (manager) => {
      const { genres: genreIds, ...animeData } = updateAnimeDto;
      const anime = await this.findById(id);

      Object.assign(anime, animeData);

      if (genreIds !== undefined) {
        anime.genres = await this.genresService.findByIds(genreIds);
      }

      const updatedAnime = await manager.save(anime);
      this.logger.log(`Anime updated: ${updatedAnime.id}`);
      return updatedAnime;
    });
  }

  async softDelete(id: string): Promise<void> {
    const anime = await this.animeRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!anime) {
      throw new NotFoundException({
        code: 'ANIME_NOT_FOUND',
        message: `Anime with ID "${id}" not found`,
      });
    }

    if (anime.deletedAt) {
      throw new UnprocessableEntityException({
        code: 'ANIME_ALREADY_DELETED',
        message: `Anime with ID "${id}" is already deleted`,
      });
    }

    await this.animeRepository.softRemove(anime);
    this.logger.log(`Anime soft deleted: ${id}`);
  }

  async restore(id: string): Promise<Anime> {
    const anime = await this.animeRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!anime) {
      throw new NotFoundException({
        code: 'ANIME_NOT_FOUND',
        message: `Anime with ID "${id}" not found`,
      });
    }

    if (!anime.deletedAt) {
      throw new UnprocessableEntityException({
        code: 'ANIME_NOT_DELETED',
        message: `Anime with ID "${id}" is not deleted`,
      });
    }

    anime.deletedAt = null;
    const restoredAnime = await this.animeRepository.save(anime);
    this.logger.log(`Anime restored: ${id}`);
    return restoredAnime;
  }

  private getSortField(sort: AnimeSortField): string {
    switch (sort) {
      case AnimeSortField.TITLE:
        return 'anime.title';
      case AnimeSortField.YEAR:
        return 'anime.year';
      case AnimeSortField.CREATED_AT:
      default:
        return 'anime.createdAt';
    }
  }

  async uploadCover(file: Express.Multer.File): Promise<Media> {
    const processedImage = await this.processCoverImage(file.buffer);
    const objectKey = `${randomUUID()}.webp`;

    await this.storageService.ensureBucket(ANIME_COVER_BUCKET, true);

    const uploadResult = await this.storageService.uploadFile(
      ANIME_COVER_BUCKET,
      objectKey,
      processedImage,
      {
        contentType: 'image/webp',
        size: processedImage.length,
      },
    );

    const mediaInput: CreateMediaInput = {
      bucket: ANIME_COVER_BUCKET,
      key: objectKey,
      originalName: file.originalname,
      mimeType: 'image/webp',
      size: processedImage.length,
      etag: uploadResult.etag,
    };

    const media = await this.mediaService.create(mediaInput);
    this.logger.log(`Anime cover uploaded: ${media.id}`);
    return media;
  }

  private async processCoverImage(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(ANIME_COVER_OUTPUT_WIDTH, ANIME_COVER_OUTPUT_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toBuffer();
  }
}
