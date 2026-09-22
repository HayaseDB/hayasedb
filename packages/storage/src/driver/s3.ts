import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import type {
  PutObjectOptions,
  S3StorageConfig,
  StorageDriver,
  StoredObject,
} from '../types'

const DEFAULT_CONTENT_TYPE = 'application/octet-stream'
const DELETE_BATCH = 1000
const REGION = 'us-east-1'

function publicReadPolicy(bucket: string): string {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadObjects',
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  })
}

function statusCode(error: unknown): number | undefined {
  return (error as { $metadata?: { httpStatusCode?: number } } | null)
    ?.$metadata?.httpStatusCode
}

function errorName(error: unknown): string | undefined {
  return (error as { name?: string } | null)?.name
}

function isNotFound(error: unknown): boolean {
  const name = errorName(error)
  return (
    name === 'NoSuchKey' || name === 'NotFound' || statusCode(error) === 404
  )
}

function isBucketAlreadyOwned(error: unknown): boolean {
  const name = errorName(error)
  return name === 'BucketAlreadyOwnedByYou' || name === 'BucketAlreadyExists'
}

export function createS3Driver(config: S3StorageConfig): StorageDriver {
  const protocol = config.useSSL ? 'https' : 'http'
  const client = new S3Client({
    region: REGION,
    endpoint: `${protocol}://${config.endpoint}:${config.port}`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  })
  const bucket = config.bucket
  const publicBaseUrl = config.publicBaseUrl.replace(/\/+$/, '')

  async function* listKeyPages(prefix: string): AsyncGenerator<string[]> {
    let continuationToken: string | undefined

    do {
      const page = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
          MaxKeys: DELETE_BATCH,
        }),
      )

      const keys = (page.Contents ?? [])
        .map((object) => object.Key)
        .filter((key): key is string => Boolean(key))
      if (keys.length > 0) yield keys

      continuationToken = page.IsTruncated
        ? page.NextContinuationToken
        : undefined
    } while (continuationToken)
  }

  return {
    provider: 's3',
    container: bucket,

    async init() {
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }))
      } catch (error) {
        if (!isNotFound(error)) throw error
        try {
          await client.send(new CreateBucketCommand({ Bucket: bucket }))
        } catch (createError) {
          if (!isBucketAlreadyOwned(createError)) throw createError
        }
      }

      await client.send(
        new PutBucketPolicyCommand({
          Bucket: bucket,
          Policy: publicReadPolicy(bucket),
        }),
      )
    },

    async put(key, body, options: PutObjectOptions = {}) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentLength: body.byteLength,
          ContentType: options.contentType,
          CacheControl: options.cacheControl,
        }),
      )
    },

    async get(key): Promise<StoredObject | null> {
      try {
        const object = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: key }),
        )
        const body = object.Body
          ? Buffer.from(await object.Body.transformToByteArray())
          : Buffer.alloc(0)

        return {
          body,
          contentType: object.ContentType ?? DEFAULT_CONTENT_TYPE,
          cacheControl: object.CacheControl ?? null,
        }
      } catch (error) {
        if (isNotFound(error)) return null
        throw error
      }
    },

    async removeByPrefix(prefix) {
      let removed = 0

      for await (const keys of listKeyPages(prefix)) {
        const result = await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
          }),
        )

        if (result.Errors?.length) {
          const detail = result.Errors.map(
            (error) => `${error.Key}: ${error.Code}`,
          ).join(', ')
          throw new Error(
            `Failed to remove ${result.Errors.length} object(s) under "${prefix}": ${detail}`,
          )
        }

        removed += keys.length
      }

      return removed
    },

    publicUrl(key) {
      return `${publicBaseUrl}/${bucket}/${key}`
    },
  }
}
