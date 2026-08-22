import { Catch, HttpException } from '@nestjs/common'
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import { COMMON_ERROR_STATUS_MAP, ORPCError } from '@orpc/server'
import type { Response } from 'express'

const CODE_BY_STATUS = new Map(
  Object.entries(COMMON_ERROR_STATUS_MAP).map(([code, status]) => [
    status,
    code,
  ]),
)

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const status = exception.getStatus()
    const code = CODE_BY_STATUS.get(status) ?? 'INTERNAL_SERVER_ERROR'

    response
      .status(status)
      .json(new ORPCError(code, { message: exception.message }).toJSON())
  }
}
