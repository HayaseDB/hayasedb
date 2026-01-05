import type { Readable } from 'stream';

export interface UploadOptions {
  bucket: string;
  objectName: string;
  data: Buffer | Readable;
  size?: number;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface DownloadOptions {
  bucket: string;
  objectName: string;
}

export interface DeleteOptions {
  bucket: string;
  objectName: string;
}

export interface PresignedUrlOptions {
  bucket: string;
  objectName: string;
  expirySeconds?: number;
}

export interface FileMetadata {
  bucket: string;
  objectName: string;
  size: number;
  contentType: string;
  etag: string;
  lastModified: Date;
  metadata?: Record<string, string>;
}

export interface BucketInfo {
  name: string;
  creationDate: Date;
}

export interface ListObjectsOptions {
  bucket: string;
  prefix?: string;
  recursive?: boolean;
}

export interface ObjectInfo {
  name: string;
  size?: number;
  etag?: string;
  lastModified?: Date;
  prefix?: string;
}

export interface UploadResult {
  bucket: string;
  objectName: string;
  etag: string;
  versionId?: string;
}
