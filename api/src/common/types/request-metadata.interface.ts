export enum DeviceType {
  MOBILE = 'Mobile',
  TABLET = 'Tablet',
  DESKTOP = 'Desktop',
  UNKNOWN = 'Unknown',
}

export interface RequestMetadata {
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  browser: string;
  browserVersion?: string;
  os: string;
  osVersion?: string;
  deviceType: DeviceType;
  referer?: string;
  origin?: string;
  language?: string;
}
