import { Inject, Injectable, Logger } from '@nestjs/common'
import { type Database, schema } from '@hayasedb/db'
import { and, eq } from 'drizzle-orm'
import type { Request } from 'express'
import { DRIZZLE } from '../../database/database.constants'
import { AuthFacade } from '../auth/auth.service'
import { MediaService } from '../media/media.service'

export interface StoredAvatar {
  id: string
  url: string
  createdAt: Date
}

export interface UploadedAvatar {
  image: string
  avatar: StoredAvatar
  headers: Headers
}

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name)

  constructor(
    private readonly media: MediaService,
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly auth: AuthFacade,
  ) {}

  async upload(
    userId: string,
    request: Request,
    file: File,
  ): Promise<UploadedAvatar> {
    const asset = await this.media.ingest(file, file.name)
    const url = this.media.publicUrl(asset)

    const { headers } = await this.auth.updateUser(request, { image: url })

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

    this.logger.log(`Stored avatar ${asset.storageKey} for user ${userId}`)

    return { image: url, avatar: { ...row, url }, headers }
  }
}
