import type { ChangeDetail } from '@hayasedb/contract'

export const UUID = (n: number) =>
  `00000000-0000-7000-8000-${String(n).padStart(12, '0')}`

export function change(overrides: Partial<ChangeDetail> = {}): ChangeDetail {
  return {
    id: UUID(1),
    ord: 0,
    entityKind: 'anime',
    entityId: UUID(2),
    op: 'update',
    baseRev: 1,
    payload: {},
    oldValues: null,
    currentValues: null,
    headRev: 1,
    conflicted: false,
    appliedRevisionId: null,
    ...overrides,
  }
}
