import { Inject, Injectable } from '@nestjs/common'
import { ORPCError } from '@orpc/server'
import { and, asc, eq, isNull, ne, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { type Database, schema } from '@hayasedb/db'
import type { Genre, GenreListItem } from '@hayasedb/contract'
import { DRIZZLE } from '../../database/database.constants'
import { genreHandler } from '../revision/registry/genre.handler'
import type { Tx } from '../revision/registry'
import { RevisionService } from '../revision/revision.service'

const NO_SIBLING_DELETES: ReadonlySet<string> = new Set()

@Injectable()
export class GenreService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly revisions: RevisionService,
  ) {}

  async list(): Promise<GenreListItem[]> {
    const animeEntity = alias(schema.entity, 'anime_entity')
    return this.db
      .select({
        id: schema.genre.id,
        name: schema.genre.name,
        animeCount: sql<number>`count(${animeEntity.id}) filter (where ${animeEntity.deletedAt} is null)::int`,
      })
      .from(schema.genre)
      .innerJoin(schema.entity, eq(schema.entity.id, schema.genre.id))
      .leftJoin(
        schema.animeGenre,
        eq(schema.animeGenre.genreId, schema.genre.id),
      )
      .leftJoin(animeEntity, eq(animeEntity.id, schema.animeGenre.animeId))
      .where(isNull(schema.entity.deletedAt))
      .groupBy(schema.genre.id)
      .orderBy(asc(schema.genre.name))
  }

  async create(name: string, editorId: string | null): Promise<Genre> {
    await this.assertNameAvailable(this.db, name)
    return this.db.transaction(async (tx) => {
      const entityId = await this.revisions.createEntity(tx, { kind: 'genre' })
      const [row] = await tx
        .insert(schema.genre)
        .values({ id: entityId, name })
        .returning({ id: schema.genre.id, name: schema.genre.name })
      await this.revisions.record(tx, {
        entityId,
        op: 'create',
        editorId,
        changesetId: null,
        document: { name },
      })
      return row!
    })
  }

  async update(
    id: string,
    name: string,
    editorId: string | null,
  ): Promise<Genre> {
    await this.assertGenreLive(id)
    await this.assertNameAvailable(this.db, name, id)
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(schema.genre)
        .set({ name })
        .where(eq(schema.genre.id, id))
        .returning({ id: schema.genre.id, name: schema.genre.name })
      if (!row) throw new ORPCError('NOT_FOUND', { message: 'Genre not found' })
      await this.revisions.record(tx, {
        entityId: id,
        op: 'update',
        editorId,
        changesetId: null,
        document: { name: row.name },
      })
      return row
    })
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

  private async assertNameAvailable(
    tx: Tx,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const conditions = [sql`lower(${schema.genre.name}) = lower(${name})`]
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
}
