import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type Provider,
} from '@nestjs/common'
import {
  type StorageConfig,
  type StorageDriver,
  createStorage,
} from '@hayasedb/storage'
import { type Env, getValidatedEnv } from '../config/env.schema'
import { STORAGE } from './storage.constants'

function buildStorageConfig(env: Env): StorageConfig {
  const publicBaseUrl = env.STORAGE_PUBLIC_URL.replace(/\/+$/, '')

  if (env.STORAGE_DRIVER === 'local') {
    return {
      driver: 'local',
      rootDir: env.STORAGE_LOCAL_ROOT,
      publicBaseUrl,
    }
  }

  return {
    driver: 'minio',
    endpoint: env.STORAGE_MINIO_ENDPOINT,
    port: env.STORAGE_MINIO_PORT,
    useSSL: env.STORAGE_MINIO_USE_SSL,
    accessKey: env.STORAGE_MINIO_ACCESS_KEY,
    secretKey: env.STORAGE_MINIO_SECRET_KEY,
    bucket: env.STORAGE_MINIO_BUCKET,
    publicBaseUrl,
  }
}

export const storageProvider: Provider = {
  provide: STORAGE,
  useFactory: (): StorageDriver =>
    createStorage(buildStorageConfig(getValidatedEnv())),
}

@Injectable()
export class StorageLifecycle implements OnApplicationBootstrap {
  private readonly logger = new Logger('Storage')

  constructor(@Inject(STORAGE) private readonly storage: StorageDriver) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.storage.init()
    this.logger.log(
      `Storage ready (${this.storage.provider}: ${this.storage.container})`,
    )
  }
}
