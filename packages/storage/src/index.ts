export interface StorageConfig {
  endpoint: string
  region: string
  accessKey: string
  secretKey: string
  bucketPublic: string
  bucketOriginal: string
}

export interface StorageClient {
  putObject(key: string, body: Uint8Array): Promise<{ key: string }>
  getObjectUrl(key: string): string
}

export function createStorageClient(config: StorageConfig): StorageClient {
  return {
    async putObject(): Promise<{ key: string }> {
      throw new Error('storage stub: putObject not implemented yet')
    },
    getObjectUrl(key: string): string {
      return `${config.endpoint}/${config.bucketPublic}/${key}`
    },
  }
}
