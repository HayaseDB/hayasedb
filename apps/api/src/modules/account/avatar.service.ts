import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthService } from '@thallesp/nestjs-better-auth'
import { type Database, schema } from '@hayasedb/db'
import sharp, { type OutputInfo } from 'sharp'
import { ulid } from 'ulid'
import type { Auth } from '../../auth/auth'
import type { Env } from '../../config/env.schema'
import { DRIZZLE } from '../../database/database.constants'
import { StorageService } from '../../storage/storage.service'

const AVATAR_SIZE = 512
const AVATAR_QUALITY = 82
const AVATAR_CONTENT_TYPE = 'image/webp'
const AVATAR_CACHE_CONTROL = 'public, max-age=31536000, immutable'

export function avatarObjectKey(userId: string, objectId: string): string {
  return `users/${userId}/avatars/${objectId}.webp`
}

export interface StoredAvatar {
  id: string
  url: string
  createdAt: Date
}

export class InvalidImageError extends Error {
  constructor(message = 'The uploaded file is not a valid image') {
    super(message)
    this.name = 'InvalidImageError'
  }
}

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name)

  constructor(
    private readonly storage: StorageService,
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly auth: AuthService<Auth>,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async upload(
    userId: string,
    headers: Headers,
    file: File,
  ): Promise<{ image: string; avatar: StoredAvatar }> {
    const input = Buffer.from(await file.arrayBuffer())

    let output: Buffer
    let info: OutputInfo
    try {
      const result = await sharp(input)
        .rotate()
        .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
        .webp({ quality: AVATAR_QUALITY })
        .toBuffer({ resolveWithObject: true })
      output = result.data
      info = result.info
    } catch (error) {
      this.logger.warn(
        `Rejected avatar for user ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
      throw new InvalidImageError()
    }

    const bucket = this.config.get('MINIO_BUCKET', { infer: true })
    const objectId = ulid()
    const key = avatarObjectKey(userId, objectId)

    await this.storage.putObject(key, output, {
      contentType: AVATAR_CONTENT_TYPE,
      cacheControl: AVATAR_CACHE_CONTROL,
    })

    const url = this.storage.publicUrl(key)

    try {
      const [row] = await this.db
        .insert(schema.avatar)
        .values({
          id: objectId,
          userId,
          bucket,
          key,
          url,
          mimeType: AVATAR_CONTENT_TYPE,
          size: output.byteLength,
          width: info.width,
          height: info.height,
          status: 'active',
        })
        .returning({
          id: schema.avatar.id,
          url: schema.avatar.url,
          createdAt: schema.avatar.createdAt,
        })

      if (!row) throw new Error('Failed to persist avatar record')

      await this.auth.api.updateUser({ body: { image: url }, headers })

      this.logger.log(`Stored avatar ${key} for user ${userId}`)

      return { image: url, avatar: row }
    } catch (error) {
      await this.storage.removeObject(key).catch((cleanupError) => {
        this.logger.error(
          `Failed to clean up orphaned avatar ${key} after upload error`,
          cleanupError instanceof Error
            ? cleanupError.stack
            : String(cleanupError),
        )
      })
      throw error
    }
  }
}
