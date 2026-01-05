import { Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from 'fs';
import { readdir, readFile, rm, stat, writeFile } from 'fs/promises';
import { lookup } from 'mime-types';
import { join } from 'path';
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

export interface LocalProviderConfig {
  basePath: string;
  baseUrl?: string;
}

export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly basePath: string;
  private readonly baseUrl: string;

  constructor(config: LocalProviderConfig) {
    this.basePath = config.basePath;
    this.baseUrl = config.baseUrl || `file://${config.basePath}`;

    if (!existsSync(this.basePath)) {
      mkdirSync(this.basePath, { recursive: true });
    }

    this.logger.log(`Local storage provider initialized at ${this.basePath}`);
  }

  private getBucketPath(bucket: string): string {
    return join(this.basePath, bucket);
  }

  private getObjectPath(bucket: string, objectName: string): string {
    return join(this.basePath, bucket, objectName);
  }

  private computeEtag(data: Buffer): string {
    return `"${createHash('md5').update(data).digest('hex')}"`;
  }

  bucketExists(bucket: string): Promise<boolean> {
    const bucketPath = this.getBucketPath(bucket);
    return Promise.resolve(
      existsSync(bucketPath) && statSync(bucketPath).isDirectory(),
    );
  }

  createBucket(bucket: string): Promise<void> {
    const bucketPath = this.getBucketPath(bucket);
    if (!existsSync(bucketPath)) {
      mkdirSync(bucketPath, { recursive: true });
      this.logger.log(`Bucket created: ${bucket}`);
    }
    return Promise.resolve();
  }

  deleteBucket(bucket: string): Promise<void> {
    const bucketPath = this.getBucketPath(bucket);
    if (existsSync(bucketPath)) {
      rmSync(bucketPath, { recursive: true });
      this.logger.log(`Bucket deleted: ${bucket}`);
    }
    return Promise.resolve();
  }

  listBuckets(): Promise<BucketInfo[]> {
    const entries = readdirSync(this.basePath, { withFileTypes: true });
    const buckets: BucketInfo[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const bucketPath = join(this.basePath, entry.name);
        const stats = statSync(bucketPath);
        buckets.push({
          name: entry.name,
          creationDate: stats.birthtime,
        });
      }
    }

    return Promise.resolve(buckets);
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const { bucket, objectName, data, contentType } = options;
    const objectPath = this.getObjectPath(bucket, objectName);
    const objectDir = join(objectPath, '..');

    if (!existsSync(objectDir)) {
      mkdirSync(objectDir, { recursive: true });
    }

    let buffer: Buffer;
    if (Buffer.isBuffer(data)) {
      buffer = data;
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of data) {
        chunks.push(Buffer.from(chunk as Uint8Array));
      }
      buffer = Buffer.concat(chunks);
    }

    await writeFile(objectPath, buffer);

    const metadataPath = `${objectPath}.meta.json`;
    const metadata = {
      contentType:
        contentType || lookup(objectName) || 'application/octet-stream',
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
    };
    await writeFile(metadataPath, JSON.stringify(metadata));

    const etag = this.computeEtag(buffer);
    this.logger.log(`File uploaded: ${bucket}/${objectName}`);

    return {
      bucket,
      objectName,
      etag,
    };
  }

  download(options: DownloadOptions): Promise<Readable> {
    const { bucket, objectName } = options;
    const objectPath = this.getObjectPath(bucket, objectName);
    return Promise.resolve(createReadStream(objectPath));
  }

  async delete(options: DeleteOptions): Promise<void> {
    const { bucket, objectName } = options;
    const objectPath = this.getObjectPath(bucket, objectName);
    const metadataPath = `${objectPath}.meta.json`;

    if (existsSync(objectPath)) {
      await rm(objectPath);
    }
    if (existsSync(metadataPath)) {
      await rm(metadataPath);
    }

    this.logger.log(`File deleted: ${bucket}/${objectName}`);
  }

  exists(bucket: string, objectName: string): Promise<boolean> {
    const objectPath = this.getObjectPath(bucket, objectName);
    return Promise.resolve(existsSync(objectPath));
  }

  async getMetadata(bucket: string, objectName: string): Promise<FileMetadata> {
    const objectPath = this.getObjectPath(bucket, objectName);
    const metadataPath = `${objectPath}.meta.json`;

    const stats = await stat(objectPath);
    let contentType = 'application/octet-stream';

    if (existsSync(metadataPath)) {
      const metaContent = await readFile(metadataPath, 'utf-8');
      const meta = JSON.parse(metaContent) as { contentType?: string };
      contentType = meta.contentType || contentType;
    }

    return {
      bucket,
      objectName,
      size: stats.size,
      contentType,
      etag: `"${stats.mtime.getTime()}"`,
      lastModified: stats.mtime,
    };
  }

  async listObjects(options: ListObjectsOptions): Promise<ObjectInfo[]> {
    const { bucket, prefix = '', recursive = false } = options;
    const bucketPath = this.getBucketPath(bucket);
    const objects: ObjectInfo[] = [];

    if (!existsSync(bucketPath)) {
      return objects;
    }

    const listDir = async (dir: string, currentPrefix: string) => {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.endsWith('.meta.json')) continue;

        const fullPath = join(dir, entry.name);
        const relativePath = currentPrefix
          ? `${currentPrefix}/${entry.name}`
          : entry.name;

        if (!relativePath.startsWith(prefix)) continue;

        if (entry.isDirectory()) {
          if (recursive) {
            await listDir(fullPath, relativePath);
          } else {
            objects.push({
              name: '',
              prefix: `${relativePath}/`,
            });
          }
        } else {
          const stats = await stat(fullPath);
          objects.push({
            name: relativePath,
            size: stats.size,
            etag: `"${stats.mtime.getTime()}"`,
            lastModified: stats.mtime,
          });
        }
      }
    };

    await listDir(bucketPath, '');
    return objects;
  }

  getPresignedUrl(options: PresignedUrlOptions): Promise<string> {
    const { bucket, objectName } = options;
    return Promise.resolve(`${this.baseUrl}/${bucket}/${objectName}`);
  }

  getPresignedPutUrl(options: PresignedUrlOptions): Promise<string> {
    const { bucket, objectName } = options;
    return Promise.resolve(`${this.baseUrl}/${bucket}/${objectName}`);
  }

  verify(): Promise<boolean> {
    try {
      if (!existsSync(this.basePath)) {
        mkdirSync(this.basePath, { recursive: true });
      }
      this.logger.log('Local storage verified successfully');
      return Promise.resolve(true);
    } catch (error) {
      this.logger.error('Local storage verification failed', error);
      return Promise.resolve(false);
    }
  }
}
