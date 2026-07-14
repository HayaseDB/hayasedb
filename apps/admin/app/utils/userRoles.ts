import type { UserRole } from '@hayasedb/contract'

export const userRoleOptions: { label: string; value: UserRole }[] = [
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' },
]

export const banDurationOptions: { label: string; value: number }[] = [
  { label: '24 hours', value: 60 * 60 * 24 },
  { label: '7 days', value: 60 * 60 * 24 * 7 },
  { label: '30 days', value: 60 * 60 * 24 * 30 },
]
