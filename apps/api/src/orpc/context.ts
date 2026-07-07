import type { UserSession } from '@thallesp/nestjs-better-auth'
import type { Request } from 'express'
import type { Auth } from '../auth/auth'

export type Session = UserSession<Auth>

declare module 'express' {
  interface Request {
    session: Session | null
    user: Session['user'] | null
  }
}

export interface ORPCContext {
  request: Request
  session: Session | null
  user: Session['user'] | null
}
