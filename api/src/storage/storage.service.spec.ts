import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { createMockStorageProvider } from '../../test/mocks';
import { STORAGE_PROVIDER_TOKEN } from './constants/storage.constants';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let mockStorageProvider: ReturnType<typeof createMockStorageProvider>;

  beforeEach(async () => {
    mockStorageProvider = createMockStorageProvider();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: STORAGE_PROVIDER_TOKEN, useValue: mockStorageProvider },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureBucket', () => {
    it('should create bucket if it does not exist', async () => {
      mockStorageProvider.bucketExists.mockResolvedValue(false);

      await service.ensureBucket('test-bucket', true);

      expect(mockStorageProvider.createBucket).toHaveBeenCalledWith(
        'test-bucket',
        undefined,
        true,
      );
    });

    it('should not create bucket if it already exists', async () => {
      mockStorageProvider.bucketExists.mockResolvedValue(true);

      await service.ensureBucket('test-bucket');

      expect(mockStorageProvider.createBucket).not.toHaveBeenCalled();
    });

    it('should check bucket existence first', async () => {
      mockStorageProvider.bucketExists.mockResolvedValue(true);

      await service.ensureBucket('my-bucket');

      expect(mockStorageProvider.bucketExists).toHaveBeenCalledWith(
        'my-bucket',
      );
    });
  });

  describe('setBucketPolicy', () => {
    it('should set bucket policy', async () => {
      const policy = JSON.stringify({ version: '1.0' });

      await service.setBucketPolicy('test-bucket', policy);

      expect(mockStorageProvider.setBucketPolicy).toHaveBeenCalledWith(
        'test-bucket',
        policy,
      );
    });
  });

  describe('bucketExists', () => {
    it('should return true when bucket exists', async () => {
      mockStorageProvider.bucketExists.mockResolvedValue(true);

      const result = await service.bucketExists('existing-bucket');

      expect(result).toBe(true);
    });

    it('should return false when bucket does not exist', async () => {
      mockStorageProvider.bucketExists.mockResolvedValue(false);

      const result = await service.bucketExists('nonexistent-bucket');

      expect(result).toBe(false);
    });
  });

  describe('createBucket', () => {
    it('should delegate to provider', async () => {
      await service.createBucket('new-bucket', 'us-east-1');

      expect(mockStorageProvider.createBucket).toHaveBeenCalledWith(
        'new-bucket',
        'us-east-1',
      );
    });
  });

  describe('deleteBucket', () => {
    it('should delegate to provider', async () => {
      await service.deleteBucket('old-bucket');

      expect(mockStorageProvider.deleteBucket).toHaveBeenCalledWith(
        'old-bucket',
      );
    });
  });

  describe('uploadFile', () => {
    it('should ensure bucket exists and upload file', async () => {
      const buffer = Buffer.from('test file content');
      mockStorageProvider.bucketExists.mockResolvedValue(true);

      const result = await service.uploadFile(
        'test-bucket',
        'test-key',
        buffer,
        {
          contentType: 'text/plain',
          size: buffer.length,
        },
      );

      expect(mockStorageProvider.upload).toHaveBeenCalledWith({
        bucket: 'test-bucket',
        objectName: 'test-key',
        data: buffer,
        contentType: 'text/plain',
        size: buffer.length,
      });
      expect(result.etag).toBe('test-etag');
    });

    it('should create bucket if it does not exist before upload', async () => {
      const buffer = Buffer.from('test');
      mockStorageProvider.bucketExists.mockResolvedValue(false);

      await service.uploadFile('new-bucket', 'key', buffer);

      expect(mockStorageProvider.createBucket).toHaveBeenCalledWith(
        'new-bucket',
        undefined,
        false,
      );
    });

    it('should pass metadata to provider', async () => {
      const buffer = Buffer.from('test');
      mockStorageProvider.bucketExists.mockResolvedValue(true);

      await service.uploadFile('bucket', 'key', buffer, {
        contentType: 'image/webp',
        metadata: { custom: 'value' },
      });

      expect(mockStorageProvider.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'image/webp',
          metadata: { custom: 'value' },
        }),
      );
    });
  });

  describe('download', () => {
    it('should download file when it exists', async () => {
      mockStorageProvider.exists.mockResolvedValue(true);
      const mockStream = { pipe: jest.fn() };
      mockStorageProvider.download.mockResolvedValue(mockStream as never);

      const result = await service.download('test-bucket', 'test-key');

      expect(result).toBe(mockStream);
      expect(mockStorageProvider.download).toHaveBeenCalledWith({
        bucket: 'test-bucket',
        objectName: 'test-key',
      });
    });

    it('should throw NotFoundException when file does not exist', async () => {
      mockStorageProvider.exists.mockResolvedValue(false);

      await expect(
        service.download('test-bucket', 'nonexistent'),
      ).rejects.toThrow(
        new NotFoundException('File not found: test-bucket/nonexistent'),
      );
    });

    it('should check file existence before downloading', async () => {
      mockStorageProvider.exists.mockResolvedValue(true);

      await service.download('bucket', 'key');

      expect(mockStorageProvider.exists).toHaveBeenCalledWith('bucket', 'key');
    });
  });

  describe('delete', () => {
    it('should delegate to provider', async () => {
      await service.delete('test-bucket', 'test-key');

      expect(mockStorageProvider.delete).toHaveBeenCalledWith({
        bucket: 'test-bucket',
        objectName: 'test-key',
      });
    });
  });

  describe('exists', () => {
    it('should return true when file exists', async () => {
      mockStorageProvider.exists.mockResolvedValue(true);

      const result = await service.exists('bucket', 'key');

      expect(result).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      mockStorageProvider.exists.mockResolvedValue(false);

      const result = await service.exists('bucket', 'missing-key');

      expect(result).toBe(false);
    });
  });

  describe('getMetadata', () => {
    it('should return file metadata', async () => {
      const metadata = {
        bucket: 'bucket',
        objectName: 'file.json',
        size: 2048,
        contentType: 'application/json',
        lastModified: new Date(),
        etag: 'custom-etag',
      };
      mockStorageProvider.getMetadata.mockResolvedValue(metadata);

      const result = await service.getMetadata('bucket', 'file.json');

      expect(result).toEqual(metadata);
      expect(mockStorageProvider.getMetadata).toHaveBeenCalledWith(
        'bucket',
        'file.json',
      );
    });
  });

  describe('listObjects', () => {
    it('should list objects in bucket', async () => {
      const objects = [
        { name: 'file1.txt', size: 100 },
        { name: 'file2.txt', size: 200 },
      ];
      mockStorageProvider.listObjects.mockResolvedValue(objects);

      const options = { bucket: 'test-bucket', prefix: 'uploads/' };
      const result = await service.listObjects(options);

      expect(result).toEqual(objects);
      expect(mockStorageProvider.listObjects).toHaveBeenCalledWith(options);
    });
  });

  describe('getPresignedUrl', () => {
    it('should generate presigned URL with default expiry', async () => {
      mockStorageProvider.getPresignedUrl.mockResolvedValue(
        'https://storage.test/presigned',
      );

      const result = await service.getPresignedUrl('bucket', 'key');

      expect(result).toBe('https://storage.test/presigned');
      expect(mockStorageProvider.getPresignedUrl).toHaveBeenCalledWith({
        bucket: 'bucket',
        objectName: 'key',
        expirySeconds: 3600,
      });
    });

    it('should generate presigned URL with custom expiry', async () => {
      await service.getPresignedUrl('bucket', 'key', 7200);

      expect(mockStorageProvider.getPresignedUrl).toHaveBeenCalledWith({
        bucket: 'bucket',
        objectName: 'key',
        expirySeconds: 7200,
      });
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('should ensure bucket exists and generate upload URL', async () => {
      mockStorageProvider.bucketExists.mockResolvedValue(false);
      mockStorageProvider.getPresignedPutUrl.mockResolvedValue(
        'https://storage.test/upload',
      );

      const result = await service.getPresignedUploadUrl('bucket', 'key');

      expect(result).toBe('https://storage.test/upload');
      expect(mockStorageProvider.createBucket).toHaveBeenCalled();
    });

    it('should use default expiry when not specified', async () => {
      mockStorageProvider.bucketExists.mockResolvedValue(true);

      await service.getPresignedUploadUrl('bucket', 'key');

      expect(mockStorageProvider.getPresignedPutUrl).toHaveBeenCalledWith({
        bucket: 'bucket',
        objectName: 'key',
        expirySeconds: 3600,
      });
    });

    it('should use custom expiry when specified', async () => {
      mockStorageProvider.bucketExists.mockResolvedValue(true);

      await service.getPresignedUploadUrl('bucket', 'key', 1800);

      expect(mockStorageProvider.getPresignedPutUrl).toHaveBeenCalledWith({
        bucket: 'bucket',
        objectName: 'key',
        expirySeconds: 1800,
      });
    });
  });

  describe('verifyConnection', () => {
    it('should delegate to provider verify', async () => {
      mockStorageProvider.verify.mockResolvedValue(true);

      const result = await service.verifyConnection();

      expect(result).toBe(true);
      expect(mockStorageProvider.verify).toHaveBeenCalled();
    });

    it('should return false when verification fails', async () => {
      mockStorageProvider.verify.mockResolvedValue(false);

      const result = await service.verifyConnection();

      expect(result).toBe(false);
    });
  });
});
