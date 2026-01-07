import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { DataSource, In, Repository } from 'typeorm';

import { CreateGenreDto } from './dto/create-genre.dto';
import {
  GenreQueryDto,
  GenreSortField,
  SortOrder,
} from './dto/genre-query.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { Genre } from './entities/genre.entity';

@Injectable()
export class GenresService {
  private readonly logger = new Logger(GenresService.name);

  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createGenreDto: CreateGenreDto): Promise<Genre> {
    return this.dataSource.transaction(async (manager) => {
      const genre = manager.create(Genre, createGenreDto);

      const savedGenre = await manager.save(genre);
      this.logger.log(`Genre created: ${savedGenre.id} (${savedGenre.slug})`);
      return savedGenre;
    });
  }

  async findAll(query: GenreQueryDto): Promise<Pagination<Genre>> {
    const {
      page = 1,
      limit = 20,
      search,
      sort = GenreSortField.NAME,
      order = SortOrder.ASC,
    } = query;

    const queryBuilder = this.genreRepository.createQueryBuilder('genre');

    if (search) {
      queryBuilder.andWhere('genre.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const sortField = this.getSortField(sort);
    const sortOrder = order === SortOrder.ASC ? 'ASC' : 'DESC';
    queryBuilder.orderBy(sortField, sortOrder);

    return paginate<Genre>(queryBuilder, { page, limit });
  }

  async findBySlug(slug: string): Promise<Genre> {
    const genre = await this.genreRepository.findOne({
      where: { slug },
    });

    if (!genre) {
      throw new NotFoundException({
        code: 'GENRE_NOT_FOUND',
        message: `Genre with slug "${slug}" not found`,
      });
    }

    return genre;
  }

  async findById(id: string): Promise<Genre> {
    const genre = await this.genreRepository.findOne({
      where: { id },
    });

    if (!genre) {
      throw new NotFoundException({
        code: 'GENRE_NOT_FOUND',
        message: `Genre with ID "${id}" not found`,
      });
    }

    return genre;
  }

  async findByIds(ids: string[]): Promise<Genre[]> {
    if (ids.length === 0) {
      return [];
    }

    const genres = await this.genreRepository.find({
      where: { id: In(ids) },
    });

    const foundIds = new Set(genres.map((g) => g.id));
    const missingIds = ids.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new NotFoundException({
        code: 'GENRES_NOT_FOUND',
        message: `Genres with IDs "${missingIds.join(', ')}" not found`,
      });
    }

    return genres;
  }

  async update(id: string, updateGenreDto: UpdateGenreDto): Promise<Genre> {
    return this.dataSource.transaction(async (manager) => {
      const genre = await this.findById(id);

      Object.assign(genre, updateGenreDto);

      const updatedGenre = await manager.save(genre);
      this.logger.log(`Genre updated: ${updatedGenre.id}`);
      return updatedGenre;
    });
  }

  async softDelete(id: string): Promise<void> {
    const genre = await this.genreRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!genre) {
      throw new NotFoundException({
        code: 'GENRE_NOT_FOUND',
        message: `Genre with ID "${id}" not found`,
      });
    }

    if (genre.deletedAt) {
      throw new UnprocessableEntityException({
        code: 'GENRE_ALREADY_DELETED',
        message: `Genre with ID "${id}" is already deleted`,
      });
    }

    await this.genreRepository.softRemove(genre);
    this.logger.log(`Genre soft deleted: ${id}`);
  }

  async restore(id: string): Promise<Genre> {
    const genre = await this.genreRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!genre) {
      throw new NotFoundException({
        code: 'GENRE_NOT_FOUND',
        message: `Genre with ID "${id}" not found`,
      });
    }

    if (!genre.deletedAt) {
      throw new UnprocessableEntityException({
        code: 'GENRE_NOT_DELETED',
        message: `Genre with ID "${id}" is not deleted`,
      });
    }

    genre.deletedAt = null;
    const restoredGenre = await this.genreRepository.save(genre);
    this.logger.log(`Genre restored: ${id}`);
    return restoredGenre;
  }

  private getSortField(sort: GenreSortField): string {
    switch (sort) {
      case GenreSortField.NAME:
        return 'genre.name';
      case GenreSortField.CREATED_AT:
      default:
        return 'genre.createdAt';
    }
  }
}
