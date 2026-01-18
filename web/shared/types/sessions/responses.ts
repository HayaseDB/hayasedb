import type { DeviceType, Paginated } from '../common'

export interface SessionResponse {
  id: string
  browser: string | null
  browserVersion: string | null
  os: string | null
  osVersion: string | null
  deviceType: DeviceType
  ipAddress: string | null
  createdAt: string
  updatedAt: string
  isCurrent: boolean
}

export type PaginatedSessionResponse = Paginated<SessionResponse>

export interface RevokedSessionsResponse {
  revokedCount: number
}
