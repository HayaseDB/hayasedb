import { Catch, HttpException } from '@nestjs/common'
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import { COMMON_ERROR_STATUS_MAP, ORPCError } from '@orpc/server'
import { APIError } from 'better-auth/api'
import type { Response } from 'express'
import { mapAuthError } from '../auth/map-auth-error'

const CODE_BY_STATUS = new Map(
  Object.entries(COMMON_ERROR_STATUS_MAP).map(([code, status]) => [
    status,
    code,
  ]),
)

const STATUS_BY_CODE = COMMON_ERROR_STATUS_MAP as Record<string, number>

function toOrpcError(exception: HttpException | APIError) {
  if (exception instanceof HttpException) {
    const status = exception.getStatus()
    const code = CODE_BY_STATUS.get(status) ?? 'INTERNAL_SERVER_ERROR'
    return {
      status,
      error: new ORPCError(code, { message: exception.message }),
    }
  }
  const error =
    mapAuthError(exception) ?? new ORPCError('INTERNAL_SERVER_ERROR')
  return { status: STATUS_BY_CODE[error.code] ?? 500, error }
}

@Catch(HttpException, APIError)
export class HttpExceptionFilter implements ExceptionFilter<
  HttpException | APIError
> {
  catch(exception: HttpException | APIError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const { status, error } = toOrpcError(exception)
    response.status(status).json(error.toJSON())
  }
}
