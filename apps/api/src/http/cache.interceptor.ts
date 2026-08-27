import { Injectable } from '@nestjs/common'
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common'
import { map } from 'rxjs'
import type { Observable } from 'rxjs'
import type { Request, Response } from 'express'
import { isFreshRequest } from './cache-headers'

@Injectable()
export class ConditionalRequestInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle()

    const request = context.switchToHttp().getRequest<Request>()
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return next.handle()
    }

    return next.handle().pipe(
      map((body) => {
        const response = context.switchToHttp().getResponse<Response>()
        const etag = response.getHeader('etag')
        if (typeof etag !== 'string' || !isFreshRequest(request, etag)) {
          return body
        }

        response.status(304)
        response.removeHeader('Content-Type')
        response.removeHeader('Content-Length')
        return undefined
      }),
    )
  }
}
