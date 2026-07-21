export const ENTITY_KINDS = ['anime'] as const
export const CHANGESET_STATUSES = [
  'draft',
  'pending',
  'approved',
  'rejected',
  'withdrawn',
  'superseded',
] as const
export const CHANGE_OPS = ['create', 'update', 'delete'] as const
export const MESSAGE_KINDS = ['comment', 'rejection', 'system'] as const

export type EntityKind = (typeof ENTITY_KINDS)[number]
export type ChangesetStatus = (typeof CHANGESET_STATUSES)[number]
export type ChangeOp = (typeof CHANGE_OPS)[number]
export type MessageKind = (typeof MESSAGE_KINDS)[number]

export const REVISABLE_STATUSES = ['rejected', 'withdrawn'] as const

export const SUPERSEDABLE_STATUSES = [
  'pending',
  'rejected',
  'withdrawn',
] as const

export type RevisableStatus = (typeof REVISABLE_STATUSES)[number]
export type SupersedableStatus = (typeof SUPERSEDABLE_STATUSES)[number]

export function isRevisableStatus(
  status: ChangesetStatus,
): status is RevisableStatus {
  return (REVISABLE_STATUSES as readonly ChangesetStatus[]).includes(status)
}

export function isSupersedableStatus(
  status: ChangesetStatus,
): status is SupersedableStatus {
  return (SUPERSEDABLE_STATUSES as readonly ChangesetStatus[]).includes(status)
}
