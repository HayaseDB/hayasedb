import { Logger } from '@nestjs/common';
import { Client as MinioClient } from 'minio';
import type { Readable } from 'stream';

import type {
  BucketInfo,
  DeleteOptions,
  DownloadOptions,
  FileMetadata,
  ListObjectsOptions,
  ObjectInfo,
  PresignedUrlOptions,
  UploadOptions,
  UploadResult,
} from '../interfaces/storage.interface';
import type { StorageProvider } from './storage-provider.interface';

export interface MinioProviderConfig {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
}

export class MinioStorageProvider implements StorageProvider {
  private readonly logger = new Logger(MinioStorageProvider.name);
  private readonly client: MinioClient;

  constructor(config: MinioProviderConfig) {
    this.client = new MinioClient({
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
    this.logger.log('MinIO storage provider initialized');
  }

  async bucketExists(bucket: string): Promise<boolean> {
    return this.client.bucketExists(bucket);
  }

  async createBucket(
    bucket: string,
    region = 'us-east-1',
    publicRead = false,
  ): Promise<void> {
    const exists = await this.bucketExists(bucket);
    if (!exists) {
      await this.client.makeBucket(bucket, region);
      this.logger.log(`Bucket created: ${bucket}`);
    }

    if (publicRead) {
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      };
      await this.setBucketPolicy(bucket, JSON.stringify(policy));
    }
  }

  async setBucketPolicy(bucket: string, policy: string): Promise<void> {
    await this.client.setBucketPolicy(bucket, policy);
    this.logger.log(`Bucket policy set: ${bucket}`);
  }

  async deleteBucket(bucket: string): Promise<void> {
    await this.client.removeBucket(bucket);
    this.logger.log(`Bucket deleted: ${bucket}`);
  }

  async listBuckets(): Promise<BucketInfo[]> {
    const buckets = await this.client.listBuckets();
    return buckets.map((b) => ({
      name: b.name,
      creationDate: b.creationDate,
    }));
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const { bucket, objectName, data, size, contentType, metadata } = options;

    const metaData: Record<string, string> = {
      'Content-Type': contentType || 'application/octet-stream',
      ...metadata,
    };

    const result = await this.client.putObject(
      bucket,
      objectName,
      data,
      size,
      metaData,
    );

    this.logger.log(`File uploaded: ${bucket}/${objectName}`);

    return {
      bucket,
      objectName,
      etag: result.etag,
      versionId: result.versionId ?? undefined,
    };
  }

  async download(options: DownloadOptions): Promise<Readable> {
    const { bucket, objectName } = options;
    return this.client.getObject(bucket, objectName);
  }

  async delete(options: DeleteOptions): Promise<void> {
    const { bucket, objectName } = options;
    await this.client.removeObject(bucket, objectName);
    this.logger.log(`File deleted: ${bucket}/${objectName}`);
  }

  async exists(bucket: string, objectName: string): Promise<boolean> {
    try {
      await this.client.statObject(bucket, objectName);
      return true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        const err = error as { code: string };
        if (err.code === 'NotFound') {
          return false;
        }
      }
      throw error;
    }
  }

  async getMetadata(bucket: string, objectName: string): Promise<FileMetadata> {
    const stat = await this.client.statObject(bucket, objectName);
    const metaData = stat.metaData as Record<string, string> | undefined;
    return {
      bucket,
      objectName,
      size: stat.size,
      contentType: metaData?.['content-type'] ?? 'application/octet-stream',
      etag: stat.etag,
      lastModified: stat.lastModified,
      metadata: metaData,
    };
  }

  async listObjects(options: ListObjectsOptions): Promise<ObjectInfo[]> {
    const { bucket, prefix = '', recursive = false } = options;
    const objects: ObjectInfo[] = [];

    return new Promise((resolve, reject) => {
      const stream = this.client.listObjects(bucket, prefix, recursive);

      stream.on('data', (obj) => {
        objects.push({
          name: obj.name || '',
          size: obj.size,
          etag: obj.etag,
          lastModified: obj.lastModified,
          prefix: obj.prefix,
        });
      });

      stream.on('end', () => resolve(objects));
      stream.on('error', reject);
    });
  }

  async getPresignedUrl(options: PresignedUrlOptions): Promise<string> {
    const { bucket, objectName, expirySeconds = 3600 } = options;
    return this.client.presignedGetObject(bucket, objectName, expirySeconds);
  }

  async getPresignedPutUrl(options: PresignedUrlOptions): Promise<string> {
    const { bucket, objectName, expirySeconds = 3600 } = options;
    return this.client.presignedPutObject(bucket, objectName, expirySeconds);
  }

  async verify(): Promise<boolean> {
    try {
      await this.client.listBuckets();
      this.logger.log('MinIO connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error('MinIO connection verification failed', error);
      return false;
    }
  }
}
