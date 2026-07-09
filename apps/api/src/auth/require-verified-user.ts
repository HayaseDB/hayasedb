import { implement } from '@orpc/server'
import { contract } from '@hayasedb/contract'
import type { ORPCContext } from '../orpc/context'

type AccountHandlerOptions = Parameters<
  Parameters<
    ReturnType<
      typeof implement<typeof contract.account.uploadAvatar>
    >['handler']
  >[0]
>[0]

type VerifiedUserErrors = AccountHandlerOptions['errors']

export function requireVerifiedUser(
  context: ORPCContext,
  errors: VerifiedUserErrors,
): string {
  const user = context.request.user
  if (!user?.id) throw errors.UNAUTHORIZED()
  if (!user.emailVerified) {
    throw errors.FORBIDDEN({ message: 'Email address is not verified' })
  }
  return user.id
}
