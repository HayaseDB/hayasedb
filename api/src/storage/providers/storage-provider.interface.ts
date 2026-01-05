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

export interface StorageProvider {
  bucketExists(bucket: string): Promise<boolean>;
  createBucket(
    bucket: string,
    region?: string,
    publicRead?: boolean,
  ): Promise<void>;
  deleteBucket(bucket: string): Promise<void>;
  listBuckets(): Promise<BucketInfo[]>;
  setBucketPolicy(bucket: string, policy: string): Promise<void>;

  upload(options: UploadOptions): Promise<UploadResult>;
  download(options: DownloadOptions): Promise<Readable>;
  delete(options: DeleteOptions): Promise<void>;
  exists(bucket: string, objectName: string): Promise<boolean>;

  getMetadata(bucket: string, objectName: string): Promise<FileMetadata>;
  listObjects(options: ListObjectsOptions): Promise<ObjectInfo[]>;

  getPresignedUrl(options: PresignedUrlOptions): Promise<string>;
  getPresignedPutUrl(options: PresignedUrlOptions): Promise<string>;

  verify(): Promise<boolean>;
}
