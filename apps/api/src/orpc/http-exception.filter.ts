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

interface OrpcErrorJson {
  defined: boolean
  inferable: boolean
  code: string
  message: string
  data?: unknown
}

function isOrpcErrorJson(value: unknown): value is OrpcErrorJson {
  if (typeof value !== 'object' || value === null) return false
  const json = value as Record<string, unknown>
  return (
    typeof json.defined === 'boolean' &&
    typeof json.inferable === 'boolean' &&
    typeof json.code === 'string' &&
    typeof json.message === 'string'
  )
}

function toOrpcError(exception: HttpException | APIError): {
  status: number
  json: OrpcErrorJson
} {
  if (exception instanceof HttpException) {
    const status = exception.getStatus()
    const body = exception.getResponse()
    if (isOrpcErrorJson(body)) {
      return { status, json: body }
    }
    const code = CODE_BY_STATUS.get(status) ?? 'INTERNAL_SERVER_ERROR'
    return {
      status,
      json: new ORPCError(code, { message: exception.message }).toJSON(),
    }
  }
  const error =
    mapAuthError(exception) ?? new ORPCError('INTERNAL_SERVER_ERROR')
  return { status: STATUS_BY_CODE[error.code] ?? 500, json: error.toJSON() }
}

@Catch(HttpException, APIError)
export class HttpExceptionFilter implements ExceptionFilter<
  HttpException | APIError
> {
  catch(exception: HttpException | APIError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const { status, json } = toOrpcError(exception)
    response.status(status).json(json)
  }
}
