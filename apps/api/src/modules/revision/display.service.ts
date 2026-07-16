import { Inject, Injectable } from '@nestjs/common'
import { inArray } from 'drizzle-orm'
import type { ContributionDisplay } from '@hayasedb/contract'
import type { RefTarget } from '@hayasedb/domain'
import { type Database, schema } from '@hayasedb/db'
import { DRIZZLE } from '../../database/database.constants'
import { StorageService } from '../../storage/storage.service'
import { collectDocumentRefs, type KindedDocument } from './diff'

type RefResolver = (
  db: Database,
  ids: string[],
) => Promise<Record<string, string>>

@Injectable()
export class DisplayService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly storage: StorageService,
  ) {}

  private readonly resolvers: Record<
    Exclude<RefTarget, 'mediaAsset'>,
    RefResolver
  > = {
    genre: async (db, ids) => {
      const rows = await db
        .select({ id: schema.genre.id, name: schema.genre.name })
        .from(schema.genre)
        .where(inArray(schema.genre.id, ids))
      return Object.fromEntries(rows.map((row) => [row.id, row.name]))
    },
  }

  async buildDisplay(
    documents: ReadonlyArray<KindedDocument>,
  ): Promise<ContributionDisplay> {
    const byTarget = collectDocumentRefs(documents)
    const { mediaAsset: mediaIds = [], ...labelTargets } = byTarget

    const [labelled, mediaAssets] = await Promise.all([
      Promise.all(
        (
          Object.entries(labelTargets) as Array<
            [Exclude<RefTarget, 'mediaAsset'>, string[]]
          >
        ).map(async ([target, ids]) =>
          ids.length === 0
            ? ([target, {}] as const)
            : ([target, await this.resolvers[target](this.db, ids)] as const),
        ),
      ),
      this.buildMediaAssets(mediaIds),
    ])

    return {
      refs: {
        ...Object.fromEntries(labelled),
        mediaAsset: Object.fromEntries(
          Object.entries(mediaAssets).map(([id, asset]) => [id, asset.url]),
        ),
      },
      mediaAssets,
    }
  }

  private async buildMediaAssets(
    ids: string[],
  ): Promise<ContributionDisplay['mediaAssets']> {
    if (ids.length === 0) return {}

    const assets = await this.db
      .select({
        id: schema.mediaAsset.id,
        storageKey: schema.mediaAsset.storageKey,
        blurhash: schema.mediaAsset.blurhash,
        width: schema.mediaAsset.width,
        height: schema.mediaAsset.height,
      })
      .from(schema.mediaAsset)
      .where(inArray(schema.mediaAsset.id, ids))

    const mediaAssets: ContributionDisplay['mediaAssets'] = {}
    for (const asset of assets) {
      mediaAssets[asset.id] = {
        url: this.storage.publicUrl(asset.storageKey),
        blurhash: asset.blurhash,
        width: asset.width,
        height: asset.height,
      }
    }
    return mediaAssets
  }
}
