import { ORPCError } from '@orpc/server'
import type { ORPCContext } from '../orpc/context'
import { requireVerifiedUser } from './require-verified-user'

export function requireAdminUser(context: ORPCContext): string {
  const userId = requireVerifiedUser(context)
  if (context.request.user?.role !== 'admin') {
    throw new ORPCError('FORBIDDEN', {
      message: 'Administrator access required',
    })
  }
  return userId
}
