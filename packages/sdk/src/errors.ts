export class HayaseDBError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'HayaseDBError';
  }
}

export class AuthenticationError extends HayaseDBError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class PermissionError extends HayaseDBError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'PERMISSION_ERROR');
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends HayaseDBError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends HayaseDBError {
  constructor(
    message = 'Validation failed',
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message, 422, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends HayaseDBError {
  constructor(
    message = 'Rate limit exceeded',
    public readonly retryAfter?: number,
  ) {
    super(message, 429, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export class InternalError extends HayaseDBError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
    this.name = 'InternalError';
  }
}
