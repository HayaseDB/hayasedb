import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { createMockRepository, type MockRepository } from '../../../test/mocks';
import { createMockMedia, resetMediaFactory } from '../../../test/factories';
import { StorageService } from '../../storage/storage.service';
import { Media } from './entities/media.entity';
import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;
  let mediaRepository: MockRepository<Media>;
  let mockStorageService: jest.Mocked<StorageService>;

  beforeEach(async () => {
    resetMediaFactory();

    mediaRepository = createMockRepository<Media>();
    mockStorageService = {
      uploadFile: jest.fn().mockResolvedValue({ etag: 'test-etag' }),
      delete: jest.fn().mockResolvedValue(undefined),
      getMetadata: jest.fn().mockResolvedValue({ size: 1024 }),
      getPresignedUrl: jest.fn().mockResolvedValue('https://storage.test/url'),
    } as unknown as jest.Mocked<StorageService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: getRepositoryToken(Media), useValue: mediaRepository },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createInput = {
      bucket: 'profile-pictures',
      key: 'user-1/picture.webp',
      originalName: 'picture.png',
      mimeType: 'image/webp',
      size: 1024,
      etag: 'test-etag',
    };

    it('should create media record', async () => {
      const mockMedia = createMockMedia();
      mediaRepository.findOne!.mockResolvedValue(null);
      mediaRepository.create!.mockReturnValue(mockMedia);
      mediaRepository.save!.mockResolvedValue(mockMedia);

      const result = await service.create(createInput);

      expect(result).toEqual(mockMedia);
      expect(mediaRepository.create).toHaveBeenCalledWith({
        bucket: 'profile-pictures',
        key: 'user-1/picture.webp',
        originalName: 'picture.png',
        mimeType: 'image/webp',
        size: 1024,
        etag: 'test-etag',
      });
    });

    it('should throw ConflictException when media already exists', async () => {
      const existingMedia = createMockMedia();
      mediaRepository.findOne!.mockResolvedValue(existingMedia);

      await expect(service.create(createInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should check for existing media before creating', async () => {
      mediaRepository.findOne!.mockResolvedValue(null);
      mediaRepository.create!.mockReturnValue(createMockMedia());
      mediaRepository.save!.mockResolvedValue(createMockMedia());

      await service.create(createInput);

      expect(mediaRepository.findOne).toHaveBeenCalledWith({
        where: { bucket: 'profile-pictures', key: 'user-1/picture.webp' },
      });
    });

    it('should set etag to null when not provided', async () => {
      const inputWithoutEtag = {
        bucket: 'profile-pictures',
        key: 'user-1/picture.webp',
        originalName: 'picture.png',
        mimeType: 'image/webp',
        size: 1024,
      };
      mediaRepository.findOne!.mockResolvedValue(null);
      mediaRepository.create!.mockReturnValue(createMockMedia());
      mediaRepository.save!.mockResolvedValue(createMockMedia());

      await service.create(inputWithoutEtag);

      expect(mediaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          etag: null,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return media when found', async () => {
      const mockMedia = createMockMedia();
      mediaRepository.findOne!.mockResolvedValue(mockMedia);

      const result = await service.findById('media-1');

      expect(result).toEqual(mockMedia);
      expect(mediaRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'media-1' },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      mediaRepository.findOne!.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByIdOrNull', () => {
    it('should return media when found', async () => {
      const mockMedia = createMockMedia();
      mediaRepository.findOne!.mockResolvedValue(mockMedia);

      const result = await service.findByIdOrNull('media-1');

      expect(result).toEqual(mockMedia);
    });

    it('should return null when not found', async () => {
      mediaRepository.findOne!.mockResolvedValue(null);

      const result = await service.findByIdOrNull('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByBucketAndKey', () => {
    it('should return media when found', async () => {
      const mockMedia = createMockMedia();
      mediaRepository.findOne!.mockResolvedValue(mockMedia);

      const result = await service.findByBucketAndKey(
        'profile-pictures',
        'user-1/picture.webp',
      );

      expect(result).toEqual(mockMedia);
      expect(mediaRepository.findOne).toHaveBeenCalledWith({
        where: { bucket: 'profile-pictures', key: 'user-1/picture.webp' },
      });
    });

    it('should return null when not found', async () => {
      mediaRepository.findOne!.mockResolvedValue(null);

      const result = await service.findByBucketAndKey(
        'profile-pictures',
        'nonexistent',
      );

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should soft delete media', async () => {
      const mockMedia = createMockMedia();
      mediaRepository.findOne!.mockResolvedValue(mockMedia);
      mediaRepository.softRemove!.mockResolvedValue(mockMedia);

      await service.delete('media-1');

      expect(mediaRepository.softRemove).toHaveBeenCalledWith(mockMedia);
    });

    it('should throw NotFoundException when media not found', async () => {
      mediaRepository.findOne!.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete media', async () => {
      const mockMedia = createMockMedia();
      mediaRepository.findOne!.mockResolvedValue(mockMedia);
      mediaRepository.remove!.mockResolvedValue(mockMedia);

      await service.hardDelete('media-1');

      expect(mediaRepository.remove).toHaveBeenCalledWith(mockMedia);
    });

    it('should find media including soft-deleted records', async () => {
      const mockMedia = createMockMedia();
      mediaRepository.findOne!.mockResolvedValue(mockMedia);
      mediaRepository.remove!.mockResolvedValue(mockMedia);

      await service.hardDelete('media-1');

      expect(mediaRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'media-1' },
        withDeleted: true,
      });
    });

    it('should throw NotFoundException when media not found', async () => {
      mediaRepository.findOne!.mockResolvedValue(null);

      await expect(service.hardDelete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUrl', () => {
    it('should return presigned URL from storage service', async () => {
      const mockMedia = createMockMedia({
        bucket: 'profile-pictures',
        key: 'test.webp',
      });

      const result = await service.getUrl(mockMedia);

      expect(result).toBe('https://storage.test/url');
      expect(mockStorageService.getPresignedUrl).toHaveBeenCalledWith(
        'profile-pictures',
        'test.webp',
        undefined,
      );
    });

    it('should pass custom expiry to storage service', async () => {
      const mockMedia = createMockMedia();

      await service.getUrl(mockMedia, 7200);

      expect(mockStorageService.getPresignedUrl).toHaveBeenCalledWith(
        mockMedia.bucket,
        mockMedia.key,
        7200,
      );
    });
  });

  describe('getUrlById', () => {
    it('should find media and return URL', async () => {
      const mockMedia = createMockMedia();
      mediaRepository.findOne!.mockResolvedValue(mockMedia);

      const result = await service.getUrlById('media-1');

      expect(result).toBe('https://storage.test/url');
    });

    it('should throw NotFoundException when media not found', async () => {
      mediaRepository.findOne!.mockResolvedValue(null);

      await expect(service.getUrlById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should pass custom expiry', async () => {
      const mockMedia = createMockMedia();
      mediaRepository.findOne!.mockResolvedValue(mockMedia);

      await service.getUrlById('media-1', 3600);

      expect(mockStorageService.getPresignedUrl).toHaveBeenCalledWith(
        mockMedia.bucket,
        mockMedia.key,
        3600,
      );
    });
  });
});
