import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { StorageService } from '../../storage/storage.service';
import { Media } from './entities/media.entity';

export interface CreateMediaInput {
  bucket: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  etag?: string;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly storageService: StorageService,
  ) {}

  async create(input: CreateMediaInput): Promise<Media> {
    const existing = await this.findByBucketAndKey(input.bucket, input.key);
    if (existing) {
      throw new ConflictException(
        `Media already exists for ${input.bucket}/${input.key}`,
      );
    }

    const media = this.mediaRepository.create({
      bucket: input.bucket,
      key: input.key,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      etag: input.etag ?? null,
    });

    const saved = await this.mediaRepository.save(media);
    this.logger.log(
      `Media created: ${saved.id} (${input.bucket}/${input.key})`,
    );
    return saved;
  }

  async findById(id: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    return media;
  }

  async findByIdOrNull(id: string): Promise<Media | null> {
    return this.mediaRepository.findOne({
      where: { id },
    });
  }

  async findByBucketAndKey(bucket: string, key: string): Promise<Media | null> {
    return this.mediaRepository.findOne({
      where: { bucket, key },
    });
  }

  async delete(id: string): Promise<void> {
    const media = await this.findById(id);
    await this.mediaRepository.softRemove(media);
    this.logger.log(`Media soft deleted: ${id}`);
  }

  async hardDelete(id: string): Promise<void> {
    const media = await this.mediaRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    await this.mediaRepository.remove(media);
    this.logger.log(`Media hard deleted: ${id}`);
  }

  async getUrl(media: Media, expirySeconds?: number): Promise<string> {
    return this.storageService.getPresignedUrl(
      media.bucket,
      media.key,
      expirySeconds,
    );
  }

  async getUrlById(id: string, expirySeconds?: number): Promise<string> {
    const media = await this.findById(id);
    return this.getUrl(media, expirySeconds);
  }
}
