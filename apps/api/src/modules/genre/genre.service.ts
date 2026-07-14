import { Inject, Injectable } from '@nestjs/common'
import { ORPCError } from '@orpc/server'
import { and, asc, eq, ne, sql } from 'drizzle-orm'
import { type Database, schema } from '@hayasedb/db'
import type { Genre, GenreListItem } from '@hayasedb/contract'
import { DRIZZLE } from '../../database/database.constants'

@Injectable()
export class GenreService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(): Promise<GenreListItem[]> {
    return this.db
      .select({
        id: schema.genre.id,
        name: schema.genre.name,
        animeCount: sql<number>`count(${schema.animeGenre.animeId})::int`,
      })
      .from(schema.genre)
      .leftJoin(
        schema.animeGenre,
        eq(schema.animeGenre.genreId, schema.genre.id),
      )
      .groupBy(schema.genre.id)
      .orderBy(asc(schema.genre.name))
  }

  async create(name: string): Promise<Genre> {
    const [existing] = await this.db
      .select({ id: schema.genre.id })
      .from(schema.genre)
      .where(eq(schema.genre.name, name))
      .limit(1)
    if (existing) {
      throw new ORPCError('CONFLICT', {
        message: 'A genre with that name already exists',
      })
    }
    const [row] = await this.db
      .insert(schema.genre)
      .values({ name })
      .returning({ id: schema.genre.id, name: schema.genre.name })
    return row!
  }

  async update(id: string, name: string): Promise<Genre> {
    const [existing] = await this.db
      .select({ id: schema.genre.id })
      .from(schema.genre)
      .where(and(eq(schema.genre.name, name), ne(schema.genre.id, id)))
      .limit(1)
    if (existing) {
      throw new ORPCError('CONFLICT', {
        message: 'A genre with that name already exists',
      })
    }
    const [row] = await this.db
      .update(schema.genre)
      .set({ name })
      .where(eq(schema.genre.id, id))
      .returning({ id: schema.genre.id, name: schema.genre.name })
    if (!row) throw new ORPCError('NOT_FOUND', { message: 'Genre not found' })
    return row
  }

  async remove(id: string): Promise<void> {
    const [used] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.animeGenre)
      .where(eq(schema.animeGenre.genreId, id))
    if ((used?.count ?? 0) > 0) {
      throw new ORPCError('CONFLICT', {
        message: 'Genre is still in use by anime',
      })
    }
    const [row] = await this.db
      .delete(schema.genre)
      .where(eq(schema.genre.id, id))
      .returning({ id: schema.genre.id })
    if (!row) throw new ORPCError('NOT_FOUND', { message: 'Genre not found' })
  }
}
