import { Catch } from '@nestjs/common'
import type { ArgumentsHost } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import { isAPIError } from 'better-auth/api'
import type { Response } from 'express'

@Catch()
export class BetterAuthErrorFilter extends BaseExceptionFilter {
  override catch(exception: unknown, host: ArgumentsHost): void {
    if (isAPIError(exception)) {
      const response = host.switchToHttp().getResponse<Response>()
      response.status(exception.statusCode).json(exception.body ?? {})
      return
    }
    super.catch(exception, host)
  }
}
