import { ORPCError } from '@orpc/server'
import { isAPIError } from 'better-auth/api'

const STATUS_TO_CODE: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'INPUT_VALIDATION_FAILED',
  429: 'TOO_MANY_REQUESTS',
}

const CODE_OVERRIDES: Record<string, string> = {
  USER_ALREADY_EXISTS: 'CONFLICT',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'CONFLICT',
  PASSWORD_ALREADY_SET: 'CONFLICT',
  FAILED_TO_UNLINK_LAST_ACCOUNT: 'CONFLICT',
  EMAIL_ALREADY_VERIFIED: 'CONFLICT',
  INVALID_TOKEN: 'BAD_REQUEST',
  INVALID_EMAIL_OR_PASSWORD: 'UNAUTHORIZED',
  BANNED_USER: 'FORBIDDEN',
}

export function mapAuthError(
  error: unknown,
): ORPCError<string, unknown> | undefined {
  if (!isAPIError(error)) return undefined

  const body = error.body as { code?: string; message?: string } | undefined
  const status = Number(error.statusCode)
  const code =
    (body?.code ? CODE_OVERRIDES[body.code] : undefined) ??
    STATUS_TO_CODE[status]

  if (!code) return new ORPCError('INTERNAL_SERVER_ERROR')

  return new ORPCError(code, { message: body?.message ?? error.message })
}
