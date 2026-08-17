import { ORPCError } from '@orpc/server'
import type { Request } from 'express'
import type { ORPCContext } from '../orpc/context'

export function isAdminRequest(request: Request): boolean {
  return request.user?.role === 'admin' && !request.apiKeyAuth
}

export function requireVerifiedUser(context: ORPCContext): string {
  const user = context.request.user
  if (!user?.id) throw new ORPCError('UNAUTHORIZED')
  if (user.banned) {
    throw new ORPCError('FORBIDDEN', {
      message: 'Account is banned',
    })
  }
  if (!user.emailVerified) {
    throw new ORPCError('FORBIDDEN', {
      message: 'Email address is not verified',
    })
  }
  return user.id
}

export function requireAdminUser(context: ORPCContext): string {
  const userId = requireVerifiedUser(context)
  if (!isAdminRequest(context.request)) {
    throw new ORPCError('FORBIDDEN', {
      message: 'Administrator access required',
    })
  }
  return userId
}
