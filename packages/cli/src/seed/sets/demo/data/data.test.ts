import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  ANIME_FORMATS,
  ANIME_RELATION_VIEW_KINDS,
  ANIME_STATUSES,
  canonicalizeRelation,
  type FuzzyDate,
} from '@hayasedb/domain'
import { SEED_ANIME } from './anime'
import { SEED_GENRES } from './genres'
import { SEED_ADMIN, SEED_USERS } from './users'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const assetFiles = new Set(
  readdirSync(fileURLToPath(new URL('../assets', import.meta.url))),
)

const referencedAssets = [
  ...SEED_ANIME.flatMap((entry) => [
    ...(entry.media?.cover ? [entry.media.cover] : []),
    ...(entry.media?.banner ? [entry.media.banner] : []),
    ...(entry.media?.gallery ?? []),
  ]),
  ...SEED_USERS.flatMap((user) => (user.avatar ? [user.avatar] : [])),
]

describe('seed anime fixtures', () => {
  it('have unique, valid slugs', () => {
    const slugs = SEED_ANIME.map((entry) => entry.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) {
      expect(slug).toMatch(SLUG_PATTERN)
      expect(slug.length).toBeLessThanOrEqual(120)
    }
  })

  it('use valid formats, statuses and relation kinds', () => {
    for (const entry of SEED_ANIME) {
      expect(ANIME_FORMATS).toContain(entry.format)
      expect(ANIME_STATUSES).toContain(entry.status)
      for (const relation of entry.relations ?? []) {
        expect(ANIME_RELATION_VIEW_KINDS).toContain(relation.kind)
      }
    }
  })

  it('cover every format', () => {
    const formats = new Set(SEED_ANIME.map((entry) => entry.format))
    for (const format of ANIME_FORMATS) expect(formats).toContain(format)
  })

  it('cover every status available on the source', () => {
    const statuses = new Set(SEED_ANIME.map((entry) => entry.status))
    for (const status of ANIME_STATUSES.filter((s) => s !== 'HIATUS')) {
      expect(statuses).toContain(status)
    }
  })

  it('include gallery media and partial release dates', () => {
    const gallery = SEED_ANIME.reduce(
      (count, entry) => count + (entry.media?.gallery?.length ?? 0),
      0,
    )
    const partialDates = SEED_ANIME.filter(
      (entry) => entry.startDate && entry.startDate.month == null,
    )
    expect(gallery).toBeGreaterThan(0)
    expect(partialDates.length).toBeGreaterThan(0)
  })

  it('cover multiple relation kinds', () => {
    const kinds = new Set(
      SEED_ANIME.flatMap((entry) =>
        (entry.relations ?? []).map((relation) => relation.kind),
      ),
    )
    expect(kinds.size).toBeGreaterThanOrEqual(5)
  })

  it('only reference relation targets within the data set', () => {
    const slugs = new Set(SEED_ANIME.map((entry) => entry.slug))
    for (const entry of SEED_ANIME) {
      for (const relation of entry.relations ?? []) {
        expect(relation.target).not.toBe(entry.slug)
        expect(slugs).toContain(relation.target)
      }
    }
  })

  it('use valid fuzzy dates', () => {
    const dateKey = (date: FuzzyDate): number =>
      date.year * 10000 + (date.month ?? 1) * 100 + (date.day ?? 1)
    for (const entry of SEED_ANIME) {
      for (const date of [entry.startDate, entry.endDate]) {
        if (!date) continue
        expect(date.year).toBeGreaterThanOrEqual(1900)
        expect(date.year).toBeLessThanOrEqual(2100)
        if (date.month != null) {
          expect(date.month).toBeGreaterThanOrEqual(1)
          expect(date.month).toBeLessThanOrEqual(12)
        }
        if (date.day != null) {
          expect(date.month).not.toBeNull()
          expect(date.day).toBeGreaterThanOrEqual(1)
          expect(date.day).toBeLessThanOrEqual(
            new Date(date.year, date.month ?? 1, 0).getDate(),
          )
        }
      }
      if (entry.startDate && entry.endDate) {
        expect(dateKey(entry.startDate)).toBeLessThanOrEqual(
          dateKey(entry.endDate),
        )
      }
      if (entry.status === 'NOT_YET_RELEASED') {
        expect(entry.endDate).toBeUndefined()
      }
      if (entry.status === 'FINISHED') {
        expect(entry.startDate).toBeDefined()
      }
    }
  })

  it('are complete: titles, description, cover, banner and genres everywhere', () => {
    for (const entry of SEED_ANIME) {
      expect(entry.titleRomaji, entry.slug).toBeTruthy()
      expect(entry.titleEnglish, entry.slug).toBeTruthy()
      expect(entry.titleNative, entry.slug).toBeTruthy()
      expect(entry.description, entry.slug).toBeTruthy()
      expect(entry.media?.cover, entry.slug).toBeTruthy()
      expect(entry.media?.banner, entry.slug).toBeTruthy()
      expect(entry.genres.length, entry.slug).toBeGreaterThan(0)
      expect(new Set(entry.genres).size).toBe(entry.genres.length)
    }
  })

  it('date all entries except cancelled ones', () => {
    for (const entry of SEED_ANIME) {
      if (entry.status === 'CANCELLED') continue
      expect(entry.startDate, entry.slug).toBeDefined()
      if (entry.status === 'FINISHED') {
        expect(entry.endDate, entry.slug).toBeDefined()
      }
    }
  })

  it('declare each relation pair with a single canonical kind', () => {
    const kindsByPair = new Map<string, Set<string>>()
    for (const entry of SEED_ANIME) {
      const keys = (entry.relations ?? []).map(
        (relation) => `${relation.target}:${relation.kind}`,
      )
      expect(new Set(keys).size, entry.slug).toBe(keys.length)
      for (const relation of entry.relations ?? []) {
        const edge = canonicalizeRelation(
          entry.slug,
          relation.target,
          relation.kind,
        )
        const pair = `${edge.sourceId}|${edge.targetId}`
        const kinds = kindsByPair.get(pair) ?? new Set<string>()
        kinds.add(edge.kind)
        kindsByPair.set(pair, kinds)
      }
    }
    for (const [pair, kinds] of kindsByPair) {
      expect(kinds.size, pair).toBe(1)
    }
  })

  it('only reference known genres', () => {
    for (const entry of SEED_ANIME) {
      for (const genre of entry.genres) {
        expect(SEED_GENRES).toContain(genre)
      }
    }
  })

  it('only reference committed asset files', () => {
    expect(referencedAssets.length).toBeGreaterThan(0)
    for (const asset of referencedAssets) {
      expect(assetFiles).toContain(asset)
    }
  })

  it('do not commit unreferenced asset files', () => {
    const referenced = new Set(referencedAssets)
    for (const file of assetFiles) {
      expect(referenced).toContain(file)
    }
  })
})

describe('seed user fixtures', () => {
  it('have unique emails and include the admin', () => {
    const emails = SEED_USERS.map((user) => user.email)
    expect(new Set(emails).size).toBe(emails.length)
    expect(SEED_USERS).toContain(SEED_ADMIN)
    expect(SEED_ADMIN.role).toBe('admin')
  })

  it('use demo-only email addresses', () => {
    for (const user of SEED_USERS) {
      expect(user.email.endsWith('.test')).toBe(true)
      expect(user.password.length).toBeGreaterThanOrEqual(8)
    }
  })
})
