import slugify from 'slugify';

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
import { Repository } from 'typeorm';

import { GenresService } from '../genres/genres.service';
import { User } from '../users/entities/user.entity';
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
  ) {}

  async create(createAnimeDto: CreateAnimeDto, user: User): Promise<Anime> {
    const { genreIds, ...animeData } = createAnimeDto;
    const slug = await this.generateUniqueSlug(animeData.title);

    const genres = genreIds ? await this.genresService.findByIds(genreIds) : [];

    const anime = this.animeRepository.create({
      ...animeData,
      slug,
      createdByUser: user,
      genres,
    });

    const savedAnime = await this.animeRepository.save(anime);
    this.logger.log(`Anime created: ${savedAnime.id} (${savedAnime.slug})`);
    return savedAnime;
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
      .leftJoinAndSelect('anime.createdByUser', 'createdByUser')
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

    return paginate<Anime>(queryBuilder, { page, limit });
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
    const { genreIds, ...animeData } = updateAnimeDto;
    const anime = await this.findById(id);

    if (animeData.title && animeData.title !== anime.title) {
      anime.slug = await this.generateUniqueSlug(animeData.title, id);
    }

    Object.assign(anime, animeData);

    if (genreIds !== undefined) {
      anime.genres = await this.genresService.findByIds(genreIds);
    }

    const updatedAnime = await this.animeRepository.save(anime);
    this.logger.log(
      `Anime updated: ${updatedAnime.id} (version ${updatedAnime.version})`,
    );
    return updatedAnime;
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

    const existingWithSlug = await this.animeRepository.findOne({
      where: { slug: anime.slug },
    });

    if (existingWithSlug) {
      anime.slug = await this.generateUniqueSlug(anime.title, id);
    }

    anime.deletedAt = null;
    const restoredAnime = await this.animeRepository.save(anime);
    this.logger.log(`Anime restored: ${id}`);
    return restoredAnime;
  }

  private async generateUniqueSlug(
    title: string,
    excludeId?: string,
  ): Promise<string> {
    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingQuery = this.animeRepository
        .createQueryBuilder('anime')
        .where('anime.slug = :slug', { slug })
        .andWhere('anime.deletedAt IS NULL');

      if (excludeId) {
        existingQuery.andWhere('anime.id != :excludeId', { excludeId });
      }

      const existing = await existingQuery.getOne();

      if (!existing) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
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
}
