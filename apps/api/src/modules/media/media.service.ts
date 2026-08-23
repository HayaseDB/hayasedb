import { createHash } from 'node:crypto'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ORPCError } from '@orpc/server'
import { encode } from 'blurhash'
import { type Database, schema } from '@hayasedb/db'
import {
  MEDIA_CACHE_CONTROL,
  MEDIA_MAX_DIMENSION,
  MEDIA_OBJECT_NAME,
  MEDIA_OUTPUT_EXTENSION,
  MEDIA_OUTPUT_MIME_TYPE,
  MEDIA_OUTPUT_QUALITY,
  mediaKeyPrefix,
  mediaObjectKey,
} from '@hayasedb/domain'
import { eq } from 'drizzle-orm'
import sharp from 'sharp'
import { DRIZZLE } from '../../database/database.constants'
import { StorageService } from '../../storage/storage.service'

const BLURHASH_COMPONENTS_X = 4
const BLURHASH_COMPONENTS_Y = 3

export interface ProcessedImage {
  output: Buffer
  width: number
  height: number
  blurhash: string | null
  checksum: string
}

export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const { data, info } = await sharp(input)
    .rotate()
    .resize(MEDIA_MAX_DIMENSION, MEDIA_MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: MEDIA_OUTPUT_QUALITY })
    .toBuffer({ resolveWithObject: true })
  return {
    output: data,
    width: info.width,
    height: info.height,
    blurhash: await computeBlurhash(data),
    checksum: createHash('sha256').update(data).digest('hex'),
  }
}

const imageLogger = new Logger('MediaImage')

async function computeBlurhash(webp: Buffer): Promise<string | null> {
  try {
    const { data, info } = await sharp(webp)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true })
    return encode(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      BLURHASH_COMPONENTS_X,
      BLURHASH_COMPONENTS_Y,
    )
  } catch (error) {
    imageLogger.warn(
      `Blurhash computation failed: ${error instanceof Error ? error.message : String(error)}`,
    )
    return null
  }
}

export interface StoredMediaAsset {
  id: string
  storageKey: string
  blurhash: string | null
  width: number | null
  height: number | null
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name)

  constructor(
    private readonly storage: StorageService,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  async ingest(
    file: File,
    originalFilename?: string,
  ): Promise<StoredMediaAsset> {
    const input = Buffer.from(await file.arrayBuffer())

    let processed: ProcessedImage
    try {
      processed = await processImage(input)
    } catch (error) {
      this.logger.warn(
        `Rejected media upload: ${error instanceof Error ? error.message : String(error)}`,
      )
      throw new ORPCError('UNPROCESSABLE_CONTENT', {
        message: 'The uploaded file is not a valid image',
        data: {
          issues: [
            {
              path: ['file'],
              message: 'The uploaded file is not a valid image',
            },
          ],
        },
      })
    }
    const { output, width, height, blurhash, checksum } = processed

    const existing = await this.findByChecksum(checksum)
    if (existing) return existing

    const prefix = mediaKeyPrefix(checksum)
    await this.storage.putObject(mediaObjectKey(checksum), output, {
      contentType: MEDIA_OUTPUT_MIME_TYPE,
      cacheControl: MEDIA_CACHE_CONTROL,
    })

    try {
      const [row] = await this.db
        .insert(schema.mediaAsset)
        .values({
          storageKey: prefix,
          bucket: this.storage.bucket,
          checksumSha256: checksum,
          mimeType: MEDIA_OUTPUT_MIME_TYPE,
          byteSize: output.byteLength,
          width,
          height,
          blurhash,
          originalFilename: originalFilename ?? null,
        })
        .onConflictDoNothing({ target: schema.mediaAsset.checksumSha256 })
        .returning(assetColumns)

      const asset = row ?? (await this.findByChecksum(checksum))
      if (!asset) throw new Error('Failed to persist media asset')
      return asset
    } catch (error) {
      const persisted = await this.findByChecksum(checksum)
      if (!persisted) {
        await this.storage.removeByPrefix(prefix).catch((cleanupError) => {
          this.logger.error(
            `Failed to clean up orphaned media ${prefix}`,
            cleanupError instanceof Error
              ? cleanupError.stack
              : String(cleanupError),
          )
        })
      }
      throw error
    }
  }

  publicUrl(asset: Pick<StoredMediaAsset, 'storageKey'>): string {
    return this.storage.publicUrl(
      `${asset.storageKey}/${MEDIA_OBJECT_NAME}.${MEDIA_OUTPUT_EXTENSION}`,
    )
  }

  async findByChecksum(checksum: string): Promise<StoredMediaAsset | null> {
    const [row] = await this.db
      .select(assetColumns)
      .from(schema.mediaAsset)
      .where(eq(schema.mediaAsset.checksumSha256, checksum))
      .limit(1)
    return row ?? null
  }

  async findById(id: string): Promise<StoredMediaAsset | null> {
    const [row] = await this.db
      .select(assetColumns)
      .from(schema.mediaAsset)
      .where(eq(schema.mediaAsset.id, id))
      .limit(1)
    return row ?? null
  }
}

const assetColumns = {
  id: schema.mediaAsset.id,
  storageKey: schema.mediaAsset.storageKey,
  blurhash: schema.mediaAsset.blurhash,
  width: schema.mediaAsset.width,
  height: schema.mediaAsset.height,
}
