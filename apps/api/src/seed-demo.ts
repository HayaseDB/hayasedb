import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { eq, sql } from 'drizzle-orm'
import { type Database, schema } from '@hayasedb/db'
import {
  ANIME_STATUSES,
  type AnimeFormat,
  type AnimeStatus,
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

interface AniListMedia {
  id: number
  format: string | null
  status: string | null
  title: {
    romaji: string | null
    english: string | null
    native: string | null
  }
  description: string | null
  genres: string[]
  coverImage: { extraLarge: string | null } | null
  bannerImage: string | null
  characters: {
    nodes: Array<{ image: { large: string | null } | null }>
  } | null
}

const GALLERY_PER_ANIME = 6

const FORMAT_MAP: Record<string, Format> = {
  TV: 'TV',
  TV_SHORT: 'TV',
  MOVIE: 'MOVIE',
  SPECIAL: 'SPECIAL',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'SPECIAL',
}

const VALID_STATUS = new Set<Status>(ANIME_STATUSES)

const QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
      id
      format
      status
      title { romaji english native }
      description(asHtml: false)
      genres
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
    .replace(/[^\w\s-]/g, '')
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

    for (const entry of list) {
      const format = entry.format ? FORMAT_MAP[entry.format] : undefined
      const status = (entry.status as Status) ?? undefined
      if (!format || !status || !VALID_STATUS.has(status)) {
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
        continue
      }

      const gIds: string[] = []
      for (const name of entry.genres) gIds.push(await ensureGenre(name))

      const created = await anime.create(
        {
          slug,
          format,
          status,
          titleRomaji: entry.title.romaji ?? undefined,
          titleEnglish: entry.title.english ?? undefined,
          titleNative: entry.title.native ?? undefined,
          description: cleanDescription(entry.description) ?? undefined,
          genreIds: gIds,
        },
        null,
      )
      const animeId = created.id
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

    logger.log('Demo seed complete.')
  } finally {
    await app.close()
  }
}

main().catch((error) => {
  console.error('[seed:demo] failed:', error)
  process.exit(1)
})
