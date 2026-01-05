import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Readable } from 'stream';

import { STORAGE_PROVIDER_TOKEN } from './constants/storage.constants';
import type {
  FileMetadata,
  ListObjectsOptions,
  ObjectInfo,
  UploadResult,
} from './interfaces/storage.interface';
import type { StorageProvider } from './providers/storage-provider.interface';

const DEFAULT_PRESIGNED_EXPIRY = 3600;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(STORAGE_PROVIDER_TOKEN)
    private readonly storageProvider: StorageProvider,
  ) {
    this.logger.log('Storage service initialized');
  }

  async ensureBucket(bucket: string, publicRead = false): Promise<void> {
    const exists = await this.storageProvider.bucketExists(bucket);
    if (!exists) {
      await this.storageProvider.createBucket(bucket, undefined, publicRead);
      this.logger.log(`Bucket created: ${bucket}`);
    }
  }

  async setBucketPolicy(bucket: string, policy: string): Promise<void> {
    await this.storageProvider.setBucketPolicy(bucket, policy);
    this.logger.log(`Bucket policy set: ${bucket}`);
  }

  async bucketExists(bucket: string): Promise<boolean> {
    return this.storageProvider.bucketExists(bucket);
  }

  async createBucket(bucket: string, region?: string): Promise<void> {
    return this.storageProvider.createBucket(bucket, region);
  }

  async deleteBucket(bucket: string): Promise<void> {
    return this.storageProvider.deleteBucket(bucket);
  }

  async uploadFile(
    bucket: string,
    objectName: string,
    data: Buffer | Readable,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
      size?: number;
    },
  ): Promise<UploadResult> {
    await this.ensureBucket(bucket);
    return this.storageProvider.upload({
      bucket,
      objectName,
      data,
      ...options,
    });
  }

  async download(bucket: string, objectName: string): Promise<Readable> {
    const exists = await this.storageProvider.exists(bucket, objectName);
    if (!exists) {
      throw new NotFoundException(`File not found: ${bucket}/${objectName}`);
    }
    return this.storageProvider.download({ bucket, objectName });
  }

  async delete(bucket: string, objectName: string): Promise<void> {
    return this.storageProvider.delete({ bucket, objectName });
  }

  async exists(bucket: string, objectName: string): Promise<boolean> {
    return this.storageProvider.exists(bucket, objectName);
  }

  async getMetadata(bucket: string, objectName: string): Promise<FileMetadata> {
    return this.storageProvider.getMetadata(bucket, objectName);
  }

  async listObjects(options: ListObjectsOptions): Promise<ObjectInfo[]> {
    return this.storageProvider.listObjects(options);
  }

  async getPresignedUrl(
    bucket: string,
    objectName: string,
    expirySeconds?: number,
  ): Promise<string> {
    return this.storageProvider.getPresignedUrl({
      bucket,
      objectName,
      expirySeconds: expirySeconds || DEFAULT_PRESIGNED_EXPIRY,
    });
  }

  async getPresignedUploadUrl(
    bucket: string,
    objectName: string,
    expirySeconds?: number,
  ): Promise<string> {
    await this.ensureBucket(bucket);
    return this.storageProvider.getPresignedPutUrl({
      bucket,
      objectName,
      expirySeconds: expirySeconds || DEFAULT_PRESIGNED_EXPIRY,
    });
  }

  async verifyConnection(): Promise<boolean> {
    return this.storageProvider.verify();
  }
}
