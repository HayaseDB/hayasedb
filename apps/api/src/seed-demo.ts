import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { eq, sql } from 'drizzle-orm'
import { type Database, schema } from '@hayasedb/db'
import {
  ANIME_FORMATS,
  ANIME_STATUSES,
  canonicalizeRelation,
  type AnimeFormat,
  type AnimeRelationKind,
  type AnimeRelationViewKind,
  type AnimeStatus,
  type FuzzyDate,
} from '@hayasedb/domain'
import { AppModule } from './app.module'
import { DRIZZLE } from './database/database.constants'
import { AnimeService } from './modules/anime/anime.service'
import { GenreService } from './modules/genre/genre.service'
import { MediaService } from './modules/media/media.service'

const ANILIST_ENDPOINT = 'https://graphql.anilist.co'
const DEMO_COUNT = Number(process.env.SEED_COUNT ?? 50)
const PER_PAGE = 50

type Format = AnimeFormat
type Status = AnimeStatus

interface AniListFuzzyDate {
  year: number | null
  month: number | null
  day: number | null
}

interface AniListMedia {
  id: number
  format: string | null
  status: string | null
  startDate: AniListFuzzyDate | null
  endDate: AniListFuzzyDate | null
  title: {
    romaji: string | null
    english: string | null
    native: string | null
  }
  description: string | null
  genres: string[]
  relations: {
    edges: Array<{ relationType: string | null; node: { id: number } | null }>
  } | null
  coverImage: { extraLarge: string | null } | null
  bannerImage: string | null
  characters: {
    nodes: Array<{ image: { large: string | null } | null }>
  } | null
}

const GALLERY_PER_ANIME = 6

const VALID_FORMAT = new Set<string>(ANIME_FORMATS)
const VALID_STATUS = new Set<string>(ANIME_STATUSES)

const RELATION_MAP: Record<string, AnimeRelationViewKind> = {
  SEQUEL: 'SEQUEL',
  PREQUEL: 'PREQUEL',
  SIDE_STORY: 'SIDE_STORY',
  SPIN_OFF: 'SPIN_OFF',
  PARENT: 'PARENT_STORY',
  SUMMARY: 'SUMMARY',
  ALTERNATIVE: 'ALTERNATIVE',
  CHARACTER: 'CHARACTER',
  OTHER: 'OTHER',
}

function toFuzzy(date: AniListFuzzyDate | null): FuzzyDate | null {
  if (!date || date.year === null) return null
  return {
    year: date.year,
    month: date.month,
    day: date.month === null ? null : date.day,
  }
}

const QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
      id
      format
      status
      startDate { year month day }
      endDate { year month day }
      title { romaji english native }
      description(asHtml: false)
      genres
      relations { edges { relationType node { id } } }
      coverImage { extraLarge }
      bannerImage
      characters(sort: [ROLE, RELEVANCE], perPage: ${GALLERY_PER_ANIME}) {
        nodes { image { large } }
      }
    }
  }
}`

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

function cleanDescription(html: string | null): string | null {
  if (!html) return null
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text.length > 0 ? text.slice(0, 5000) : null
}

async function fetchAniListPage(page: number): Promise<{
  media: AniListMedia[]
  hasNextPage: boolean
}> {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      query: QUERY,
      variables: { page, perPage: PER_PAGE },
    }),
  })
  if (!res.ok) throw new Error(`AniList request failed: ${res.status}`)
  const json = (await res.json()) as {
    data?: {
      Page?: { media?: AniListMedia[]; pageInfo?: { hasNextPage?: boolean } }
    }
  }
  return {
    media: json.data?.Page?.media ?? [],
    hasNextPage: json.data?.Page?.pageInfo?.hasNextPage ?? false,
  }
}

async function fetchAniList(count: number): Promise<AniListMedia[]> {
  const all: AniListMedia[] = []
  let page = 1
  while (all.length < count) {
    const { media, hasNextPage } = await fetchAniListPage(page)
    all.push(...media)
    if (!hasNextPage) break
    page += 1
  }
  return all
}

async function downloadImage(url: string): Promise<File> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Image download failed: ${res.status} ${url}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const type = res.headers.get('content-type') ?? 'image/jpeg'
  const name = url.split('/').pop() ?? 'image'
  return new File([buffer], name, { type })
}

async function main() {
  const logger = new Logger('SeedDemo')

  if (process.env.NODE_ENV === 'production') {
    logger.error('Refusing to run the demo seed with NODE_ENV=production.')
    process.exitCode = 1
    return
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  })

  const db = app.get<Database>(DRIZZLE)
  const anime = app.get(AnimeService)
  const media = app.get(MediaService)
  const genres = app.get(GenreService)

  try {
    const [seededRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.anime)
    const seeded = seededRow?.count ?? 0
    logger.log(
      `Fetching popular anime from AniList (target ${DEMO_COUNT} new)…`,
    )
    const list = await fetchAniList(seeded + DEMO_COUNT)
    logger.log(`Fetched ${list.length} titles`)

    const genreIds = new Map<string, string>()
    const existingGenres = await db
      .select({ id: schema.genre.id, name: schema.genre.name })
      .from(schema.genre)
    for (const g of existingGenres) genreIds.set(g.name, g.id)

    async function ensureGenre(name: string): Promise<string> {
      const cached = genreIds.get(name)
      if (cached) return cached
      const row = await genres.create(name, null)
      genreIds.set(name, row.id)
      return row.id
    }

    const animeIdByAniList = new Map<number, string>()
    const pendingRelations: Array<{
      anilistId: number
      animeId: string
      edges: NonNullable<AniListMedia['relations']>['edges']
    }> = []
    const queueRelations = (entry: AniListMedia, animeId: string) => {
      if (entry.relations?.edges.length) {
        pendingRelations.push({
          anilistId: entry.id,
          animeId,
          edges: entry.relations.edges,
        })
      }
    }

    for (const entry of list) {
      const format = entry.format as Format | null
      const status = entry.status as Status | null
      if (
        !format ||
        !status ||
        !VALID_FORMAT.has(format) ||
        !VALID_STATUS.has(status)
      ) {
        logger.warn(
          `Skipping ${entry.title.romaji ?? entry.id} (unsupported format/status: ${entry.format}/${entry.status})`,
        )
        continue
      }

      const baseTitle =
        entry.title.romaji ?? entry.title.english ?? String(entry.id)
      let slug = slugify(baseTitle)
      if (!slug) slug = `anime-${entry.id}`

      const existing = await db
        .select({ id: schema.anime.id })
        .from(schema.anime)
        .where(eq(schema.anime.slug, slug))
        .limit(1)
      if (existing[0]) {
        logger.log(`Already seeded: ${slug}`)
        animeIdByAniList.set(entry.id, existing[0].id)
        queueRelations(entry, existing[0].id)
        continue
      }

      const gIds: string[] = []
      for (const name of entry.genres) gIds.push(await ensureGenre(name))

      const created = await anime.create(
        {
          slug,
          format,
          status,
          startDate: toFuzzy(entry.startDate),
          endDate: toFuzzy(entry.endDate),
          titleRomaji: entry.title.romaji ?? undefined,
          titleEnglish: entry.title.english ?? undefined,
          titleNative: entry.title.native ?? undefined,
          description: cleanDescription(entry.description) ?? undefined,
          genreIds: gIds,
        },
        null,
      )
      const animeId = created.id
      animeIdByAniList.set(entry.id, animeId)
      queueRelations(entry, animeId)
      logger.log(`Created ${slug}`)

      const coverUrl = entry.coverImage?.extraLarge
      if (coverUrl) {
        try {
          const file = await downloadImage(coverUrl)
          const asset = await media.ingest(file, `${slug}-cover`)
          await anime.attachMedia(
            { animeId, mediaId: asset.id, type: 'COVER' },
            null,
          )
        } catch (error) {
          logger.warn(
            `Cover failed for ${slug}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }
      if (entry.bannerImage) {
        try {
          const file = await downloadImage(entry.bannerImage)
          const asset = await media.ingest(file, `${slug}-banner`)
          await anime.attachMedia(
            {
              animeId,
              mediaId: asset.id,
              type: 'BANNER',
            },
            null,
          )
        } catch (error) {
          logger.warn(
            `Banner failed for ${slug}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }

      const galleryUrls = (entry.characters?.nodes ?? [])
        .map((n) => n.image?.large)
        .filter((url): url is string => Boolean(url))
      for (const url of galleryUrls) {
        try {
          const file = await downloadImage(url)
          const asset = await media.ingest(file, `${slug}-gallery`)
          await anime.attachMedia(
            {
              animeId,
              mediaId: asset.id,
              type: 'GALLERY',
            },
            null,
          )
        } catch (error) {
          logger.warn(
            `Gallery image failed for ${slug}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }
    }

    const relationsBySource = new Map<string, Set<string>>()
    for (const pending of pendingRelations) {
      for (const edge of pending.edges) {
        const view = edge.relationType ? RELATION_MAP[edge.relationType] : null
        const otherId = edge.node ? animeIdByAniList.get(edge.node.id) : null
        if (!view || !otherId || otherId === pending.animeId) continue
        const canonical = canonicalizeRelation(pending.animeId, otherId, view)
        const set = relationsBySource.get(canonical.sourceId) ?? new Set()
        set.add(`${canonical.targetId}:${canonical.kind}`)
        relationsBySource.set(canonical.sourceId, set)
      }
    }
    for (const [sourceId, keys] of relationsBySource) {
      const current = await anime.getById(sourceId, { includeDeleted: true })
      const relations = current.relations
        .filter((r) => r.owned)
        .map((r) => canonicalizeRelation(sourceId, r.anime.id, r.kind))
        .map((r) => ({ targetId: r.targetId, kind: r.kind }))
      for (const key of keys) {
        const [targetId, kind] = key.split(':') as [string, AnimeRelationKind]
        if (
          !relations.some((r) => r.targetId === targetId && r.kind === kind)
        ) {
          relations.push({ targetId, kind })
        }
      }
      await anime.update({ id: sourceId, relations }, null)
    }
    logger.log(`Linked relations for ${relationsBySource.size} anime.`)

    logger.log('Demo seed complete.')
  } finally {
    await app.close()
  }
}

main().catch((error) => {
  console.error('[seed:demo] failed:', error)
  process.exit(1)
})
