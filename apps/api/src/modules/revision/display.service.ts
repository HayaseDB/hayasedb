import { Inject, Injectable } from '@nestjs/common'
import { eq, inArray } from 'drizzle-orm'
import type { ContributionDisplay } from '@hayasedb/contract'
import { formatEpisodeNumber, type RefTarget } from '@hayasedb/domain'
import { type Database, schema } from '@hayasedb/db'
import { DRIZZLE } from '../../database/database.constants'
import { preferredLocalized } from '../localization'
import { MediaService } from '../media/media.service'
import { collectDocumentRefs, type KindedDocument } from './diff'

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

type RefResolver = (
  db: Database,
  ids: string[],
) => Promise<Record<string, string>>

function pickLabels<
  T extends { id: string; locale: string; original: boolean },
>(rows: T[], label: (row: T) => string): Record<string, string> {
  const byId = new Map<string, T[]>()
  for (const row of rows) {
    const bucket = byId.get(row.id)
    if (bucket) bucket.push(row)
    else byId.set(row.id, [row])
  }

  const labels: Record<string, string> = {}
  for (const [id, candidates] of byId) {
    const preferred = preferredLocalized(candidates)
    if (preferred) labels[id] = label(preferred)
  }
  return labels
}

@Injectable()
export class DisplayService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly media: MediaService,
  ) {}

  private readonly resolvers: Record<
    Exclude<RefTarget, 'mediaAsset'>,
    RefResolver
  > = {
    genre: async (db, ids) => {
      const rows = await db
        .select({
          id: schema.genre.id,
          slug: schema.genre.slug,
          name: schema.genreTranslation.name,
          locale: schema.genreTranslation.locale,
        })
        .from(schema.genre)
        .leftJoin(
          schema.genreTranslation,
          eq(schema.genreTranslation.genreId, schema.genre.id),
        )
        .where(inArray(schema.genre.id, ids))

      const labels = pickLabels(
        rows.flatMap((row) =>
          row.locale === null || row.name === null
            ? []
            : [
                {
                  id: row.id,
                  locale: row.locale,
                  name: row.name,
                  original: false,
                },
              ],
        ),
        (row) => row.name,
      )
      for (const row of rows) labels[row.id] ??= row.slug
      return labels
    },
    anime: async (db, ids) => {
      const rows = await db
        .select({
          id: schema.anime.id,
          slug: schema.anime.slug,
          title: schema.animeTranslation.title,
          locale: schema.animeTranslation.locale,
          original: schema.animeTranslation.original,
        })
        .from(schema.anime)
        .leftJoin(
          schema.animeTranslation,
          eq(schema.animeTranslation.animeId, schema.anime.id),
        )
        .where(inArray(schema.anime.id, ids))

      const labels = pickLabels(
        rows.flatMap((row) =>
          row.locale === null || row.title === null
            ? []
            : [
                {
                  id: row.id,
                  locale: row.locale,
                  title: row.title,
                  original: row.original ?? false,
                },
              ],
        ),
        (row) => row.title,
      )
      for (const row of rows) labels[row.id] ??= row.slug
      return labels
    },
    animeSeason: async (db, ids) => {
      const rows = await db
        .select({
          id: schema.animeSeason.id,
          kind: schema.animeSeason.kind,
          number: schema.animeSeason.number,
          position: schema.animeSeason.position,
          title: schema.animeSeasonTranslation.title,
          locale: schema.animeSeasonTranslation.locale,
          original: schema.animeSeasonTranslation.original,
        })
        .from(schema.animeSeason)
        .leftJoin(
          schema.animeSeasonTranslation,
          eq(schema.animeSeasonTranslation.seasonId, schema.animeSeason.id),
        )
        .where(inArray(schema.animeSeason.id, ids))

      const labels = pickLabels(
        rows.flatMap((row) =>
          row.locale === null || row.title === null
            ? []
            : [
                {
                  id: row.id,
                  locale: row.locale,
                  title: row.title,
                  original: row.original ?? false,
                },
              ],
        ),
        (row) => row.title,
      )
      for (const row of rows) {
        labels[row.id] ??= `${titleCase(row.kind)} ${
          formatEpisodeNumber(row.number) ?? row.position + 1
        }`
      }
      return labels
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
      parents: {},
      contexts: {},
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
        url: this.media.publicUrl(asset),
        blurhash: asset.blurhash,
        width: asset.width,
        height: asset.height,
      }
    }
    return mediaAssets
  }
}
