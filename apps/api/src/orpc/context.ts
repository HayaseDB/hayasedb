import type { UserSession } from '@thallesp/nestjs-better-auth'
import type { Request } from 'express'
import type { Auth } from '../auth/auth'

export type Session = UserSession<Auth>

declare module 'express' {
  interface Request {
    session: Session | null
    user: Session['user'] | null
    internal: boolean
    apiKeyAuth: boolean
  }
}

export interface ORPCContext {
  request: Request
  resHeaders?: Headers | undefined
}

declare module '@orpc/server' {
  interface DefaultInitialContext {
    request: ORPCContext['request']
    resHeaders?: Headers | undefined
  }
}
