// Re-export all shared types and enums for external consumers
export * from '@hayasedb/shared';

// SDK client
export { HayaseDB } from './client';
export type { HayaseDBConfig, RequestOptions } from './types';
export type { PaginatedResponse, PaginationMeta, PaginationParams } from './pagination';
export {
  HayaseDBError,
  AuthenticationError,
  InternalError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  ValidationError,
} from './errors';
