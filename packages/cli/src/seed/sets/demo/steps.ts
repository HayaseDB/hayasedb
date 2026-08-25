import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { schema } from '@hayasedb/db'
import {
  canonicalizeRelation,
  CHANGESET_STATUSES,
  type AnimeRelationKind,
} from '@hayasedb/domain'
import { ORPCError } from '@orpc/client'
import { consola } from 'consola'
import { withAuth, withDb } from '../../../context'
import { findUserByEmail } from '../../../users'
import type { ApiClient } from '../../api-client'
import { ensureUsers } from '../../ensure'
import type { SeedAnime, SeedContext, SeedStep } from '../../types'
import { SEED_ANIME } from './data/anime'
import { SEED_GENRES } from './data/genres'
import { SEED_USERS } from './data/users'

async function genreIdsByName(client: ApiClient): Promise<Map<string, string>> {
  const { items } = await client.genre.list()
  return new Map(items.map((genre) => [genre.name, genre.id]))
}

async function findAnimeIdBySlug(
  client: ApiClient,
  slug: string,
): Promise<string | null> {
  try {
    const detail = await client.anime.getBySlug({ slug })
    return detail.id
  } catch (error) {
    if (error instanceof ORPCError && error.code === 'NOT_FOUND') return null
    throw error
  }
}

async function attachMedia(
  context: SeedContext,
  client: ApiClient,
  animeId: string,
  entry: SeedAnime,
): Promise<void> {
  const media = entry.media
  if (!media) return
  if (media.cover) {
    await client.anime.addMedia({
      animeId,
      type: 'COVER',
      file: await context.loadAsset(media.cover),
    })
  }
  if (media.banner) {
    await client.anime.addMedia({
      animeId,
      type: 'BANNER',
      file: await context.loadAsset(media.banner),
    })
  }
  for (const asset of media.gallery ?? []) {
    await client.anime.addMedia({
      animeId,
      type: 'GALLERY',
      file: await context.loadAsset(asset),
    })
  }
}

export const usersStep: SeedStep = {
  name: 'users',
  description: 'Create the demo admin and member accounts',
  provisionsUsers: true,
  async run(context) {
    await ensureUsers(context.env, SEED_USERS)
  },
}

export const genresStep: SeedStep = {
  name: 'genres',
  description: 'Create the genre catalog',
  async run(context) {
    const client = await context.client()
    const existing = await genreIdsByName(client)
    for (const name of SEED_GENRES) {
      if (existing.has(name)) continue
      await client.genre.create({ name })
      consola.success(`Created genre ${name}.`)
    }
  },
}

export const animeStep: SeedStep = {
  name: 'anime',
  description: 'Create the anime entries with covers and banners',
  async run(context) {
    const client = await context.client()
    const genreIds = await genreIdsByName(client)
    const needed = new Set(SEED_ANIME.flatMap((entry) => entry.genres))
    for (const name of needed) {
      if (genreIds.has(name)) continue
      const genre = await client.genre.create({ name })
      genreIds.set(name, genre.id)
      consola.success(`Created genre ${name}.`)
    }
    for (const entry of SEED_ANIME) {
      if (await findAnimeIdBySlug(client, entry.slug)) {
        consola.info(`Anime ${entry.slug} already exists.`)
        continue
      }
      const created = await client.anime.create({
        slug: entry.slug,
        format: entry.format,
        status: entry.status,
        titleRomaji: entry.titleRomaji,
        titleEnglish: entry.titleEnglish,
        titleNative: entry.titleNative,
        description: entry.description,
        startDate: entry.startDate ?? null,
        endDate: entry.endDate ?? null,
        genreIds: entry.genres.map((name) => {
          const id = genreIds.get(name)
          if (!id) throw new Error(`Unknown seed genre "${name}"`)
          return id
        }),
      })
      await attachMedia(context, client, created.id, entry)
      consola.success(`Created anime ${entry.slug}.`)
    }
  },
}

export const relationsStep: SeedStep = {
  name: 'relations',
  description: 'Link franchise relations between the anime entries',
  dependsOn: ['anime'],
  async run(context) {
    const client = await context.client()
    const animeIds = new Map<string, string>()
    for (const entry of SEED_ANIME) {
      const id = await findAnimeIdBySlug(client, entry.slug)
      if (id) animeIds.set(entry.slug, id)
    }

    const edgesBySource = new Map<string, Set<string>>()
    for (const entry of SEED_ANIME) {
      const selfId = animeIds.get(entry.slug)
      if (!selfId) continue
      for (const relation of entry.relations ?? []) {
        const targetId = animeIds.get(relation.target)
        if (!targetId) {
          throw new Error(`Unknown relation target "${relation.target}"`)
        }
        const edge = canonicalizeRelation(selfId, targetId, relation.kind)
        const set = edgesBySource.get(edge.sourceId) ?? new Set<string>()
        set.add(`${edge.targetId}:${edge.kind}`)
        edgesBySource.set(edge.sourceId, set)
      }
    }

    let linked = 0
    for (const [sourceId, keys] of edgesBySource) {
      const current = await client.anime.getById({ id: sourceId })
      const relations = current.relations
        .filter((relation) => relation.owned)
        .map((relation) =>
          canonicalizeRelation(sourceId, relation.anime.id, relation.kind),
        )
        .map((edge) => ({ targetId: edge.targetId, kind: edge.kind }))
      let changed = false
      for (const key of keys) {
        const [targetId, kind] = key.split(':') as [string, AnimeRelationKind]
        if (
          !relations.some(
            (relation) =>
              relation.targetId === targetId && relation.kind === kind,
          )
        ) {
          relations.push({ targetId, kind })
          changed = true
        }
      }
      if (changed) {
        await client.anime.update({ id: sourceId, relations })
        linked += 1
      }
    }
    consola.success(`Linked relations for ${linked} anime.`)
  },
}

export const avatarsStep: SeedStep = {
  name: 'avatars',
  description: 'Upload profile avatars for the demo accounts',
  dependsOn: ['users'],
  async run(context) {
    const withImage = await withDb(context.env, async (db) => {
      const rows = await db
        .select({ email: schema.user.email, image: schema.user.image })
        .from(schema.user)
      return new Set(rows.filter((row) => row.image).map((row) => row.email))
    })
    for (const seedUser of SEED_USERS) {
      if (!seedUser.avatar) continue
      if (withImage.has(seedUser.email)) {
        consola.info(`User ${seedUser.email} already has an avatar.`)
        continue
      }
      const client = await context.clientFor(seedUser)
      await client.account.uploadAvatar({
        file: await context.loadAsset(seedUser.avatar),
      })
      consola.success(`Uploaded avatar for ${seedUser.email}.`)
    }
  },
}

export const apiKeysStep: SeedStep = {
  name: 'api-keys',
  description: 'Issue an API key for each demo account',
  dependsOn: ['users'],
  async run(context) {
    await withAuth(context.env, async (auth, db) => {
      for (const seedUser of SEED_USERS) {
        const user = await findUserByEmail(db, seedUser.email)
        if (!user) continue
        const [existing] = await db
          .select({ id: schema.apikey.id })
          .from(schema.apikey)
          .where(eq(schema.apikey.referenceId, user.id))
          .limit(1)
        if (existing) {
          consola.info(`User ${seedUser.email} already has an API key.`)
          continue
        }
        await auth.api.createApiKey({
          body: { name: 'Demo key', userId: user.id },
        })
        consola.success(`Created API key for ${seedUser.email}.`)
      }
    })
  },
}

async function requireAnime(client: ApiClient, slug: string) {
  const detail = await client.anime.getBySlug({ slug })
  return { id: detail.id, headRev: detail.headRev }
}

function cycleAt<T>(items: T[], index: number): T {
  const item = items[index % items.length]
  if (item === undefined) throw new Error('Cannot pick from an empty list')
  return item
}

export const contributionsStep: SeedStep = {
  name: 'contributions',
  description: 'Submit community changesets covering every review outcome',
  dependsOn: ['anime'],
  async run(context) {
    const members = SEED_USERS.filter((user) => user.role === 'user')
    const moderators = SEED_USERS.filter((user) => user.role === 'admin')
    if (members.length === 0 || moderators.length === 0) {
      throw new Error(
        'Demo seed requires at least one member and one admin user',
      )
    }
    const authorClientAt = (index: number) =>
      context.clientFor(cycleAt(members, index))
    const moderatorClientAt = (index: number) =>
      context.clientFor(cycleAt(moderators, index))

    const admin = await context.client()

    const summaries = new Set<string>()
    for (const status of CHANGESET_STATUSES) {
      const { items } = await admin.changeset.list({
        status,
        limit: 100,
        offset: 0,
      })
      for (const changeset of items) summaries.add(changeset.summary)
    }
    const exists = (summary: string): boolean => {
      if (!summaries.has(summary)) return false
      consola.info(`Changeset "${summary}" already exists.`)
      return true
    }

    const [first, second, third] = SEED_ANIME
    const musicEntry =
      SEED_ANIME.find((entry) => entry.format === 'MUSIC') ??
      SEED_ANIME[SEED_ANIME.length - 1]
    if (!first || !second || !third || !musicEntry) {
      throw new Error('Demo seed requires at least four anime entries')
    }

    const pendingSummary = `Expand the synopsis of ${first.titleRomaji ?? first.slug}`
    if (!exists(pendingSummary)) {
      const authorClient = await authorClientAt(0)
      const commenterClient = await moderatorClientAt(0)
      const target = await requireAnime(authorClient, first.slug)
      const pending = await authorClient.changeset.submit({
        summary: pendingSummary,
        changes: [
          {
            op: 'update',
            entityKind: 'anime',
            entityId: target.id,
            baseRev: target.headRev,
            payload: {
              description:
                `${first.description ?? ''}\n\nThis entry is part of the demo dataset and is pending community review.`.trim(),
            },
          },
        ],
      })
      await commenterClient.changeset.addMessage({
        id: pending.id,
        body: 'Nice addition, the current synopsis was quite thin.',
      })
      consola.success(`Submitted pending changeset "${pendingSummary}".`)
    }

    const approvedSummary = 'Add the Award Winning genre to the catalog'
    if (!exists(approvedSummary)) {
      const authorClient = await authorClientAt(1)
      const moderator = await moderatorClientAt(1)
      const approved = await authorClient.changeset.submit({
        summary: approvedSummary,
        changes: [
          {
            op: 'create',
            entityKind: 'genre',
            entityId: randomUUID(),
            payload: { name: 'Award Winning' },
          },
        ],
      })
      await moderator.changeset.addMessage({
        id: approved.id,
        body: 'Good catch, merging this into the catalog.',
      })
      await moderator.changeset.approve({ id: approved.id })
      consola.success(`Approved changeset "${approvedSummary}".`)
    }

    const rejectedSummary = `Remove ${musicEntry.titleRomaji ?? musicEntry.slug} from the database`
    if (!exists(rejectedSummary)) {
      const authorClient = await authorClientAt(2)
      const moderator = await moderatorClientAt(2)
      const target = await requireAnime(authorClient, musicEntry.slug)
      const rejected = await authorClient.changeset.submit({
        summary: rejectedSummary,
        changes: [
          {
            op: 'delete',
            entityKind: 'anime',
            entityId: target.id,
            baseRev: target.headRev,
          },
        ],
      })
      await moderator.changeset.reject({
        id: rejected.id,
        reason:
          'Music videos are in scope for the database, so this entry should stay.',
      })
      consola.success(`Rejected changeset "${rejectedSummary}".`)
    }

    const withdrawnSummary = `Rework the description of ${second.titleRomaji ?? second.slug}`
    if (!exists(withdrawnSummary)) {
      const authorClient = await authorClientAt(3)
      const target = await requireAnime(authorClient, second.slug)
      const withdrawn = await authorClient.changeset.submit({
        summary: withdrawnSummary,
        changes: [
          {
            op: 'update',
            entityKind: 'anime',
            entityId: target.id,
            baseRev: target.headRev,
            payload: {
              description:
                `${second.description ?? ''}\n\nDraft rewrite that still needs sources.`.trim(),
            },
          },
        ],
      })
      await authorClient.changeset.withdraw({ id: withdrawn.id })
      consola.success(`Withdrew changeset "${withdrawnSummary}".`)
    }

    const supersededSummary = `Fix the English title of ${third.titleRomaji ?? third.slug}`
    const supersedingSummary = `Fix the English title and synopsis of ${third.titleRomaji ?? third.slug}`
    if (!exists(supersedingSummary)) {
      const authorClient = await authorClientAt(4)
      const target = await requireAnime(authorClient, third.slug)
      const superseded = await authorClient.changeset.submit({
        summary: supersededSummary,
        changes: [
          {
            op: 'update',
            entityKind: 'anime',
            entityId: target.id,
            baseRev: target.headRev,
            payload: {
              titleEnglish:
                third.titleEnglish ?? third.titleRomaji ?? third.slug,
            },
          },
        ],
      })
      await authorClient.changeset.submit({
        summary: supersedingSummary,
        supersedesId: superseded.id,
        changes: [
          {
            op: 'update',
            entityKind: 'anime',
            entityId: target.id,
            baseRev: target.headRev,
            payload: {
              titleEnglish:
                third.titleEnglish ?? third.titleRomaji ?? third.slug,
              description:
                `${third.description ?? ''}\n\nRevised submission that supersedes my earlier draft.`.trim(),
            },
          },
        ],
      })
      consola.success(`Superseded changeset "${supersededSummary}".`)
    }
  },
}
