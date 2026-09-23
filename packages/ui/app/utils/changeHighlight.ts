import type { ChangeKind } from '#imports'

export const CHANGE_RING_CLASS: Record<ChangeKind, string> = {
  unchanged: '',
  changed: 'ring-info ring-1',
  added: 'ring-info ring-1',
  removed: 'ring-error border-dashed ring-1',
}

export const CHANGE_FIELD_COLOR: Record<
  ChangeKind,
  'info' | 'error' | undefined
> = {
  unchanged: undefined,
  changed: 'info',
  added: 'info',
  removed: 'error',
}

export const CHANGE_LABEL: Record<ChangeKind, string | undefined> = {
  unchanged: undefined,
  changed: 'Changed',
  added: 'New',
  removed: 'Removed',
}
