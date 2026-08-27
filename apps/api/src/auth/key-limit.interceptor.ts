import { Injectable } from '@nestjs/common'
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common'
import type { Request } from 'express'
import type { Observable } from 'rxjs'
import { tap } from 'rxjs'
import { getApiKey } from './api-access.guard'
import { KeyLimitCache } from './key-limit-cache'

@Injectable()
export class KeyLimitInterceptor implements NestInterceptor {
  constructor(private readonly keyLimits: KeyLimitCache) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle()

    const request = context.switchToHttp().getRequest<Request>()
    const apiKey = getApiKey(request)
    if (!apiKey || !request.user?.id) return next.handle()

    return next.handle().pipe(
      tap({
        next: () => {
          void this.keyLimits
            .get(apiKey)
            .then((cached) =>
              cached ? undefined : this.keyLimits.refresh(apiKey),
            )
        },
      }),
    )
  }
}
