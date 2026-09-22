export interface PutObjectOptions {
  contentType?: string
  cacheControl?: string
}

export interface StoredObject {
  body: Buffer
  contentType: string
  cacheControl: string | null
}

export type StorageProvider = 's3' | 'local'

export interface StorageDriver {
  readonly provider: StorageProvider
  readonly container: string
  put(key: string, body: Buffer, options?: PutObjectOptions): Promise<void>
  get(key: string): Promise<StoredObject | null>
  removeByPrefix(prefix: string): Promise<number>
  publicUrl(key: string): string
  init(): Promise<void>
}

export interface S3StorageConfig {
  readonly driver: 's3'
  readonly endpoint: string
  readonly port: number
  readonly useSSL: boolean
  readonly accessKey: string
  readonly secretKey: string
  readonly bucket: string
  readonly publicBaseUrl: string
}

export interface LocalStorageConfig {
  readonly driver: 'local'
  readonly rootDir: string
  readonly publicBaseUrl: string
}

export type StorageConfig = S3StorageConfig | LocalStorageConfig
