import { createLocalDriver } from './driver/local'
import { createMinioDriver } from './driver/minio'
import type { StorageConfig, StorageDriver } from './types'

function assertNever(value: never): never {
  throw new Error(`Unsupported storage driver: ${JSON.stringify(value)}`)
}

export function createStorage(config: StorageConfig): StorageDriver {
  switch (config.driver) {
    case 'minio':
      return createMinioDriver(config)
    case 'local':
      return createLocalDriver(config)
    default:
      return assertNever(config)
  }
}
