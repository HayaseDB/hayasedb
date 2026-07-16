import { Inject, Injectable, Logger } from '@nestjs/common'
import { AuthService } from '@thallesp/nestjs-better-auth'
import { type Database, schema } from '@hayasedb/db'
import { and, eq } from 'drizzle-orm'
import type { Auth } from '../../auth/auth'
import { DRIZZLE } from '../../database/database.constants'
import { MediaService } from '../media/media.service'

export interface StoredAvatar {
  id: string
  url: string
  createdAt: Date
}

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name)

  constructor(
    private readonly media: MediaService,
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly auth: AuthService<Auth>,
  ) {}

  async upload(
    userId: string,
    headers: Headers,
    file: File,
  ): Promise<{ image: string; avatar: StoredAvatar }> {
    const asset = await this.media.ingest(file, file.name)
    const url = this.media.publicUrl(asset)

    const row = await this.db.transaction(async (tx) => {
      await tx
        .update(schema.userAvatar)
        .set({ isCurrent: false })
        .where(
          and(
            eq(schema.userAvatar.userId, userId),
            eq(schema.userAvatar.isCurrent, true),
          ),
        )

      const [existing] = await tx
        .update(schema.userAvatar)
        .set({ isCurrent: true })
        .where(
          and(
            eq(schema.userAvatar.userId, userId),
            eq(schema.userAvatar.mediaAssetId, asset.id),
          ),
        )
        .returning({
          id: schema.userAvatar.id,
          createdAt: schema.userAvatar.createdAt,
        })
      if (existing) return existing

      const [inserted] = await tx
        .insert(schema.userAvatar)
        .values({ userId, mediaAssetId: asset.id, isCurrent: true })
        .returning({
          id: schema.userAvatar.id,
          createdAt: schema.userAvatar.createdAt,
        })

      if (!inserted) throw new Error('Failed to persist avatar record')
      return inserted
    })

    await this.auth.api.updateUser({ body: { image: url }, headers })

    this.logger.log(`Stored avatar ${asset.storageKey} for user ${userId}`)

    return { image: url, avatar: { ...row, url } }
  }
}
