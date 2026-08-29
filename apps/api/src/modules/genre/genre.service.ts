import { Inject, Injectable } from '@nestjs/common'
import { ORPCError } from '@orpc/server'
import { and, asc, eq, exists, ilike, isNull, ne, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { type Database, schema } from '@hayasedb/db'
import type { Genre, GenreListItem, ListGenresInput } from '@hayasedb/contract'
import { DRIZZLE } from '../../database/database.constants'
import { genreHandler } from '../revision/registry/genre.handler'
import type { Tx } from '../revision/registry'
import { RevisionService } from '../revision/revision.service'
import { preferredLocalized } from '../localization'

const NO_SIBLING_DELETES: ReadonlySet<string> = new Set()

@Injectable()
export class GenreService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly revisions: RevisionService,
  ) {}

  private baseQuery(where: SQL | undefined) {
    const animeEntity = alias(schema.entity, 'anime_entity')
    return this.db
      .select({
        id: schema.genre.id,
        slug: schema.genre.slug,
        animeCount: sql<number>`count(${animeEntity.id}) filter (where ${animeEntity.deletedAt} is null)::int`,
      })
      .from(schema.genre)
      .innerJoin(schema.entity, eq(schema.entity.id, schema.genre.id))
      .leftJoin(
        schema.animeGenre,
        eq(schema.animeGenre.genreId, schema.genre.id),
      )
      .leftJoin(animeEntity, eq(animeEntity.id, schema.animeGenre.animeId))
      .where(where)
      .groupBy(schema.genre.id)
  }

  async list(
    input: ListGenresInput = {},
    acceptLanguage?: string,
  ): Promise<{ items: GenreListItem[]; meta: { total: number } }> {
    const conditions = [isNull(schema.entity.deletedAt)]
    if (input.name) {
      conditions.push(
        exists(
          this.db
            .select({ one: sql`1` })
            .from(schema.genreTranslation)
            .where(
              and(
                eq(schema.genreTranslation.genreId, schema.genre.id),
                sql`lower(${schema.genreTranslation.name}) = lower(${input.name})`,
              ),
            ),
        ),
      )
    }
    if (input.q) {
      conditions.push(
        exists(
          this.db
            .select({ one: sql`1` })
            .from(schema.genreTranslation)
            .where(
              and(
                eq(schema.genreTranslation.genreId, schema.genre.id),
                ilike(schema.genreTranslation.name, `%${input.q}%`),
              ),
            ),
        ),
      )
    }
    const rows = await this.baseQuery(and(...conditions)).orderBy(
      asc(schema.genre.slug),
    )
    const items = await this.decorate(rows, acceptLanguage)
    items.sort((a, b) => a.name.localeCompare(b.name))
    return { items, meta: { total: items.length } }
  }

  async getById(id: string, acceptLanguage?: string): Promise<GenreListItem> {
    const [row] = await this.baseQuery(
      and(eq(schema.genre.id, id), isNull(schema.entity.deletedAt)),
    ).limit(1)
    if (!row) throw new ORPCError('NOT_FOUND', { message: 'Genre not found' })
    return (await this.decorate([row], acceptLanguage))[0]!
  }

  async create(
    document: {
      slug: string
      translations: { locale: string; name: string }[]
    },
    editorId: string | null,
  ): Promise<Genre> {
    await this.assertSlugAvailable(this.db, document.slug)
    const id = await this.db.transaction(async (tx) => {
      const entityId = await this.revisions.createEntity(tx, { kind: 'genre' })
      await genreHandler.apply(tx, 'create', entityId, document, null)
      await this.revisions.record(tx, {
        entityId,
        op: 'create',
        editorId,
        changesetId: null,
        document,
      })
      return entityId
    })
    return this.getById(id)
  }

  async update(
    id: string,
    patch: { slug?: string; translations?: { locale: string; name: string }[] },
    editorId: string | null,
  ): Promise<Genre> {
    await this.assertGenreLive(id)
    if (patch.slug) await this.assertSlugAvailable(this.db, patch.slug, id)
    await this.db.transaction(async (tx) => {
      const previous = await genreHandler.serialize(tx, id)
      await genreHandler.apply(tx, 'update', id, patch, previous)
      await this.revisions.record(tx, {
        entityId: id,
        op: 'update',
        editorId,
        changesetId: null,
        document: await genreHandler.serialize(tx, id),
      })
    })
    return this.getById(id)
  }

  async remove(id: string, editorId: string | null): Promise<void> {
    await this.assertGenreLive(id)
    const blocked = await genreHandler.checkDelete!(
      this.db,
      id,
      NO_SIBLING_DELETES,
    )
    if (blocked) throw new ORPCError('CONFLICT', { message: blocked })

    await this.db.transaction(async (tx) => {
      const document = await genreHandler.serialize(tx, id)
      await tx
        .update(schema.entity)
        .set({ deletedAt: new Date() })
        .where(eq(schema.entity.id, id))
      await this.revisions.record(tx, {
        entityId: id,
        op: 'delete',
        editorId,
        changesetId: null,
        document,
      })
    })
  }

  private async assertGenreLive(id: string): Promise<void> {
    const [row] = await this.db
      .select({ id: schema.genre.id })
      .from(schema.genre)
      .innerJoin(schema.entity, eq(schema.entity.id, schema.genre.id))
      .where(and(eq(schema.genre.id, id), isNull(schema.entity.deletedAt)))
      .limit(1)
    if (!row) throw new ORPCError('NOT_FOUND', { message: 'Genre not found' })
  }

  private async assertSlugAvailable(
    tx: Tx,
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const conditions = [eq(schema.genre.slug, slug)]
    if (excludeId) conditions.push(ne(schema.genre.id, excludeId))
    const [existing] = await tx
      .select({ id: schema.genre.id })
      .from(schema.genre)
      .where(and(...conditions))
      .limit(1)
    if (existing) {
      throw new ORPCError('CONFLICT', {
        message: 'A genre with that name already exists',
      })
    }
  }

  private async decorate(
    rows: { id: string; slug: string; animeCount: number }[],
    acceptLanguage?: string,
  ): Promise<GenreListItem[]> {
    const documents = await genreHandler.serializeMany(
      this.db,
      rows.map((row) => row.id),
    )
    return rows.map((row) => {
      const document = documents.get(row.id)!
      const selected = preferredLocalized(
        document.translations,
        acceptLanguage,
      )!
      return {
        id: row.id,
        slug: row.slug,
        name: selected.name,
        locale: selected.locale,
        translations: document.translations,
        animeCount: row.animeCount,
      }
    })
  }
}
