import { createLocalDriver } from './driver/local'
import { createS3Driver } from './driver/s3'
import type { StorageConfig, StorageDriver } from './types'

function assertNever(value: never): never {
  throw new Error(`Unsupported storage driver: ${JSON.stringify(value)}`)
}

export function createStorage(config: StorageConfig): StorageDriver {
  switch (config.driver) {
    case 's3':
      return createS3Driver(config)
    case 'local':
      return createLocalDriver(config)
    default:
      return assertNever(config)
  }
}
