import { ORPCError } from '@orpc/server'
import type { ORPCContext } from '../orpc/context'

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
