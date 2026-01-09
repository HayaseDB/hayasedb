import type { Media } from '../../src/modules/media/entities/media.entity';

let mediaIdCounter = 0;

export const resetMediaFactory = (): void => {
  mediaIdCounter = 0;
};

export const createMockMedia = (overrides: Partial<Media> = {}): Media => {
  const id = overrides.id ?? `media-${++mediaIdCounter}`;
  const now = new Date();
  const bucket = overrides.bucket ?? 'profile-pictures';
  const key = overrides.key ?? `user-1/${Date.now()}.webp`;

  return {
    id,
    bucket,
    key,
    originalName: overrides.originalName ?? 'profile-picture.png',
    mimeType: overrides.mimeType ?? 'image/webp',
    size: overrides.size ?? 1024,
    etag: 'etag' in overrides ? overrides.etag : 'test-etag',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    deletedAt: 'deletedAt' in overrides ? overrides.deletedAt : null,
    get url(): string {
      return `http://localhost:3000/storage/${bucket}/${key}`;
    },
  } as Media;
};

export const createDeletedMedia = (overrides: Partial<Media> = {}): Media => {
  return createMockMedia({
    deletedAt: new Date(),
    ...overrides,
  });
};
