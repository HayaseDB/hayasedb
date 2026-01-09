import type { Readable } from 'stream';

import type { StorageProvider } from '../../src/storage/providers/storage-provider.interface';

export const createMockStorageProvider = (): jest.Mocked<StorageProvider> => ({
  bucketExists: jest.fn().mockResolvedValue(true),
  createBucket: jest.fn().mockResolvedValue(undefined),
  deleteBucket: jest.fn().mockResolvedValue(undefined),
  listBuckets: jest.fn().mockResolvedValue([]),
  setBucketPolicy: jest.fn().mockResolvedValue(undefined),

  upload: jest
    .fn()
    .mockResolvedValue({ etag: 'test-etag', versionId: undefined }),
  download: jest.fn().mockResolvedValue({
    pipe: jest.fn(),
    on: jest.fn(),
  } as unknown as Readable),
  delete: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(true),

  getMetadata: jest.fn().mockResolvedValue({
    size: 1024,
    contentType: 'image/webp',
    lastModified: new Date(),
    etag: 'test-etag',
  }),
  listObjects: jest.fn().mockResolvedValue([]),

  getPresignedUrl: jest
    .fn()
    .mockResolvedValue('https://storage.test/presigned-url'),
  getPresignedPutUrl: jest
    .fn()
    .mockResolvedValue('https://storage.test/presigned-put-url'),

  verify: jest.fn().mockResolvedValue(true),
});
