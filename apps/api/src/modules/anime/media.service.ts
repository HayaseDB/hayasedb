import { createHash } from 'node:crypto'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ORPCError } from '@orpc/server'
import { encode } from 'blurhash'
import { eq } from 'drizzle-orm'
import { type Database, schema } from '@hayasedb/db'
import sharp from 'sharp'
import type { Env } from '../../config/env.schema'
import { DRIZZLE } from '../../database/database.constants'
import { StorageService } from '../../storage/storage.service'

const OUTPUT_CONTENT_TYPE = 'image/webp'
const OUTPUT_QUALITY = 85
const MAX_DIMENSION = 2048
const CACHE_CONTROL = 'public, max-age=31536000, immutable'
const BLURHASH_COMPONENTS_X = 4
const BLURHASH_COMPONENTS_Y = 3

export interface StoredMediaAsset {
  id: string
  url: string
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
    private readonly config: ConfigService<Env, true>,
  ) {}

  async ingest(
    file: File,
    originalFilename?: string,
  ): Promise<StoredMediaAsset> {
    const input = Buffer.from(await file.arrayBuffer())

    let output: Buffer
    let width: number
    let height: number
    let blurhash: string | null
    try {
      const result = await sharp(input)
        .rotate()
        .resize(MAX_DIMENSION, MAX_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: OUTPUT_QUALITY })
        .toBuffer({ resolveWithObject: true })
      output = result.data
      width = result.info.width
      height = result.info.height
      blurhash = await this.computeBlurhash(output)
    } catch (error) {
      this.logger.warn(
        `Rejected media upload: ${error instanceof Error ? error.message : String(error)}`,
      )
      throw new ORPCError('INPUT_VALIDATION_FAILED', {
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

    const checksum = createHash('sha256').update(output).digest('hex')

    const existing = await this.findByChecksum(checksum)
    if (existing) return existing

    const storageKey = `originals/${checksum}.webp`
    await this.storage.putObject(storageKey, output, {
      contentType: OUTPUT_CONTENT_TYPE,
      cacheControl: CACHE_CONTROL,
    })

    try {
      const [row] = await this.db
        .insert(schema.mediaAsset)
        .values({
          storageKey,
          bucket: this.config.get('MINIO_BUCKET', { infer: true }),
          checksumSha256: checksum,
          mimeType: OUTPUT_CONTENT_TYPE,
          byteSize: output.byteLength,
          width,
          height,
          blurhash,
          originalFilename: originalFilename ?? null,
        })
        .onConflictDoNothing({ target: schema.mediaAsset.checksumSha256 })
        .returning({
          id: schema.mediaAsset.id,
          storageKey: schema.mediaAsset.storageKey,
          blurhash: schema.mediaAsset.blurhash,
          width: schema.mediaAsset.width,
          height: schema.mediaAsset.height,
        })

      const asset = row
        ? this.toStoredAsset(row)
        : await this.findByChecksum(checksum)
      if (!asset) throw new Error('Failed to persist media asset')
      return asset
    } catch (error) {
      const persisted = await this.findByChecksum(checksum)
      if (!persisted) {
        await this.storage.removeObject(storageKey).catch((cleanupError) => {
          this.logger.error(
            `Failed to clean up orphaned media ${storageKey}`,
            cleanupError instanceof Error
              ? cleanupError.stack
              : String(cleanupError),
          )
        })
      }
      throw error
    }
  }

  private async findByChecksum(
    checksum: string,
  ): Promise<StoredMediaAsset | null> {
    const [row] = await this.db
      .select({
        id: schema.mediaAsset.id,
        storageKey: schema.mediaAsset.storageKey,
        blurhash: schema.mediaAsset.blurhash,
        width: schema.mediaAsset.width,
        height: schema.mediaAsset.height,
      })
      .from(schema.mediaAsset)
      .where(eq(schema.mediaAsset.checksumSha256, checksum))
      .limit(1)
    return row ? this.toStoredAsset(row) : null
  }

  private toStoredAsset(row: {
    id: string
    storageKey: string
    blurhash: string | null
    width: number | null
    height: number | null
  }): StoredMediaAsset {
    return {
      id: row.id,
      url: this.storage.publicUrl(row.storageKey),
      blurhash: row.blurhash,
      width: row.width,
      height: row.height,
    }
  }

  private async computeBlurhash(webp: Buffer): Promise<string | null> {
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
      this.logger.warn(
        `Blurhash computation failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      return null
    }
  }
}
