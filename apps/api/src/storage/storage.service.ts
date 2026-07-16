import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MinioService } from 'nestjs-minio-client'
import type { Env } from '../config/env.schema'

export interface PutObjectOptions {
  contentType?: string
  cacheControl?: string
}

const BUCKET_REGION = 'us-east-1'

function publicReadPolicy(bucket: string): string {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  })
}

function isBucketAlreadyOwned(error: unknown): boolean {
  const code =
    error instanceof Error && 'code' in error
      ? (error as { code?: string }).code
      : undefined
  return code === 'BucketAlreadyOwnedByYou' || code === 'BucketAlreadyExists'
}

@Injectable()
export class StorageService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StorageService.name)
  private readonly bucketName: string
  private readonly publicBaseUrl: string

  constructor(
    private readonly minio: MinioService,
    config: ConfigService<Env, true>,
  ) {
    this.bucketName = config.get('MINIO_BUCKET', { infer: true })
    this.publicBaseUrl = config
      .get('MINIO_PUBLIC_URL', { infer: true })
      .replace(/\/+$/, '')
  }

  get bucket(): string {
    return this.bucketName
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureBucket()
  }

  async putObject(
    key: string,
    body: Buffer,
    options: PutObjectOptions = {},
  ): Promise<void> {
    const metaData: Record<string, string> = {}
    if (options.contentType) metaData['Content-Type'] = options.contentType
    if (options.cacheControl) metaData['Cache-Control'] = options.cacheControl

    await this.minio.client.putObject(
      this.bucketName,
      key,
      body,
      body.byteLength,
      metaData,
    )
  }

  private async listKeys(prefix: string): Promise<string[]> {
    const stream = this.minio.client.listObjectsV2(
      this.bucketName,
      prefix,
      true,
    )
    const keys: string[] = []
    for await (const item of stream) {
      if (item.name) keys.push(item.name)
    }
    return keys
  }

  async removeByPrefix(prefix: string): Promise<number> {
    const keys = await this.listKeys(prefix)
    if (keys.length === 0) return 0
    await this.minio.client.removeObjects(this.bucketName, keys)
    return keys.length
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${this.bucketName}/${key}`
  }

  private async ensureBucket(): Promise<void> {
    const exists = await this.minio.client.bucketExists(this.bucketName)
    if (!exists) {
      try {
        await this.minio.client.makeBucket(this.bucketName, BUCKET_REGION)
      } catch (error) {
        if (!isBucketAlreadyOwned(error)) throw error
      }
    }
    await this.minio.client.setBucketPolicy(
      this.bucketName,
      publicReadPolicy(this.bucketName),
    )
    this.logger.log(`Media bucket "${this.bucketName}" is ready`)
  }
}
