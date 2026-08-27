import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import type { ThrottlerRequest } from '@nestjs/throttler'

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected override async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    try {
      return await super.handleRequest(requestProps)
    } finally {
      this.mirrorHeaders(requestProps)
    }
  }

  private mirrorHeaders(requestProps: ThrottlerRequest): void {
    const { context, limit, ttl, throttler } = requestProps
    if ((throttler.name ?? 'default') !== 'default') return

    const { res } = this.getRequestResponse(context)
    if (typeof res?.getHeader !== 'function' || res.headersSent) return

    const remaining = res.getHeader(`${this.headerPrefix}-Remaining`)
    const reset = res.getHeader(`${this.headerPrefix}-Reset`)
    const retryAfter = res.getHeader('Retry-After')

    res.setHeader('RateLimit-Limit', String(limit))
    res.setHeader('RateLimit-Policy', `${limit};w=${Math.ceil(ttl / 1000)}`)
    if (remaining !== undefined) {
      res.setHeader('RateLimit-Remaining', String(remaining))
    }
    const resetSeconds = reset ?? retryAfter
    if (resetSeconds !== undefined) {
      res.setHeader('RateLimit-Reset', String(resetSeconds))
    }
  }
}
