import { Client } from 'minio'
import type {
  PutObjectOptions,
  MinioStorageConfig,
  StorageDriver,
  StoredObject,
} from '../types'

const BUCKET_REGION = 'us-east-1'
const DEFAULT_CONTENT_TYPE = 'application/octet-stream'

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

function errorCode(error: unknown): string | undefined {
  return error instanceof Error && 'code' in error
    ? (error as { code?: string }).code
    : undefined
}

function isBucketAlreadyOwned(error: unknown): boolean {
  const code = errorCode(error)
  return code === 'BucketAlreadyOwnedByYou' || code === 'BucketAlreadyExists'
}

function isNotFound(error: unknown): boolean {
  const code = errorCode(error)
  return code === 'NotFound' || code === 'NoSuchKey'
}

async function readStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export function createMinioDriver(config: MinioStorageConfig): StorageDriver {
  const client = new Client({
    endPoint: config.endpoint,
    port: config.port,
    useSSL: config.useSSL,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    pathStyle: true,
  })
  const bucket = config.bucket
  const publicBaseUrl = config.publicBaseUrl.replace(/\/+$/, '')

  async function listKeys(prefix: string): Promise<string[]> {
    const stream = client.listObjectsV2(bucket, prefix, true)
    const keys: string[] = []
    for await (const item of stream) {
      if (item.name) keys.push(item.name)
    }
    return keys
  }

  return {
    provider: 'minio',
    container: bucket,

    async init() {
      const exists = await client.bucketExists(bucket)
      if (!exists) {
        try {
          await client.makeBucket(bucket, BUCKET_REGION)
        } catch (error) {
          if (!isBucketAlreadyOwned(error)) throw error
        }
      }
      await client.setBucketPolicy(bucket, publicReadPolicy(bucket))
    },

    async put(key, body, options: PutObjectOptions = {}) {
      const metaData: Record<string, string> = {}
      if (options.contentType) metaData['Content-Type'] = options.contentType
      if (options.cacheControl) metaData['Cache-Control'] = options.cacheControl
      await client.putObject(bucket, key, body, body.byteLength, metaData)
    },

    async get(key): Promise<StoredObject | null> {
      try {
        const [stat, stream] = await Promise.all([
          client.statObject(bucket, key),
          client.getObject(bucket, key),
        ])
        return {
          body: await readStream(stream),
          contentType: stat.metaData?.['content-type'] ?? DEFAULT_CONTENT_TYPE,
          cacheControl: stat.metaData?.['cache-control'] ?? null,
        }
      } catch (error) {
        if (isNotFound(error)) return null
        throw error
      }
    },

    async removeByPrefix(prefix) {
      const keys = await listKeys(prefix)
      if (keys.length === 0) return 0
      await client.removeObjects(bucket, keys)
      return keys.length
    },

    publicUrl(key) {
      return `${publicBaseUrl}/${bucket}/${key}`
    },
  }
}
