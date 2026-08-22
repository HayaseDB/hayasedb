import type { Request } from 'express'

export function forwardSetCookie(request: Request, headers: Headers): void {
  for (const cookie of headers.getSetCookie()) {
    request.res?.appendHeader('set-cookie', cookie)
  }
}
