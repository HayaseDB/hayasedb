import { ORPCError } from '@orpc/server'
import { orderEtag } from './order-etag'

export function assertOrderEtag(
  expected: string,
  currentIds: readonly string[],
): void {
  if (expected !== orderEtag(currentIds)) {
    throw new ORPCError('PRECONDITION_FAILED', {
      message: 'The collection order changed since it was read',
    })
  }
}

export function assertOrderCovers(
  requested: readonly string[],
  currentIds: readonly string[],
): void {
  const current = new Set(currentIds)
  if (
    new Set(requested).size !== requested.length ||
    requested.length !== current.size ||
    requested.some((id) => !current.has(id))
  ) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'The requested order must list every item exactly once',
    })
  }
}
