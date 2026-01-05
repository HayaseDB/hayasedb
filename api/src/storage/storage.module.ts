import { Global, Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

import { AppConfig, Environment } from '../config/app.config';
import { MinioConfig } from '../config/minio.config';
import { StorageConfig, StorageProvider } from '../config/storage.config';
import { STORAGE_PROVIDER_TOKEN } from './constants/storage.constants';
import { LocalStorageProvider } from './providers/local.provider';
import { MinioStorageProvider } from './providers/minio.provider';
import type { StorageProvider as IStorageProvider } from './providers/storage-provider.interface';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

export function createStorageProvider(
  configService: ConfigService,
): IStorageProvider {
  const logger = new Logger('StorageProviderFactory');
  const storageConfig = configService.getOrThrow<StorageConfig>('storage');

  if (storageConfig.API_STORAGE_PROVIDER === StorageProvider.Local) {
    const basePath =
      storageConfig.API_STORAGE_LOCAL_PATH || join(process.cwd(), '.storage');

    logger.log(`Initializing local storage provider at ${basePath}`);

    return new LocalStorageProvider({
      basePath,
      baseUrl: storageConfig.API_STORAGE_LOCAL_BASE_URL,
    });
  }

  const minioConfig = configService.getOrThrow<MinioConfig>('minio');

  logger.log('Initializing MinIO storage provider');

  return new MinioStorageProvider({
    endPoint: minioConfig.API_MINIO_HOST,
    port: minioConfig.API_MINIO_PORT,
    useSSL: minioConfig.API_MINIO_USE_SSL,
    accessKey: minioConfig.API_MINIO_ACCESS_KEY,
    secretKey: minioConfig.API_MINIO_SECRET_KEY,
  });
}

@Global()
@Module({
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_PROVIDER_TOKEN,
      useFactory: createStorageProvider,
      inject: [ConfigService],
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule implements OnModuleInit {
  private readonly logger = new Logger(StorageModule.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  async onModuleInit() {
    const appConfig = this.configService.get<AppConfig>('app');
    const isDevelopment = appConfig?.API_ENV === Environment.Development;

    if (!isDevelopment) {
      const verified = await this.storageService.verifyConnection();
      if (verified) {
        this.logger.log('Storage module initialized successfully');
      } else {
        this.logger.warn('Storage connection verification failed');
      }
    } else {
      this.logger.log('Storage connection verification skipped (development)');
    }
  }
}
