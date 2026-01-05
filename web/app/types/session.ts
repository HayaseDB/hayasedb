export type DeviceType = 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown'

export interface Session {
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
