import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MinioModule } from 'nestjs-minio-client'
import type { Env } from '../config/env.schema'
import { StorageService } from './storage.service'

@Module({
  imports: [
    MinioModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        endPoint: config.get('MINIO_ENDPOINT', { infer: true }),
        port: config.get('MINIO_PORT', { infer: true }),
        useSSL: config.get('MINIO_USE_SSL', { infer: true }),
        accessKey: config.get('MINIO_ACCESS_KEY', { infer: true }),
        secretKey: config.get('MINIO_SECRET_KEY', { infer: true }),
        pathStyle: true,
      }),
    }),
  ],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
