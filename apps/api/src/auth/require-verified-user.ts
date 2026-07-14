import { ORPCError } from '@orpc/server'
import type { ORPCContext } from '../orpc/context'

export function requireVerifiedUser(context: ORPCContext): string {
  const user = context.request.user
  if (!user?.id) throw new ORPCError('UNAUTHORIZED')
  if (!user.emailVerified) {
    throw new ORPCError('FORBIDDEN', {
      message: 'Email address is not verified',
    })
  }
  return user.id
}
