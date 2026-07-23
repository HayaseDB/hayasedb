import { Inject, Injectable } from '@nestjs/common'
import { eq, isNull, ne, sql } from 'drizzle-orm'
import type Redis from 'ioredis'
import type { SystemStats } from '@hayasedb/contract'
import { type Database, schema } from '@hayasedb/db'
import { DRIZZLE } from '../../database/database.constants'
import { REDIS } from '../../redis/redis.constants'

const STATS_CACHE_KEY = 'system:stats'
const STATS_CACHE_TTL_SECONDS = 10

@Injectable()
export class SystemService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async stats(): Promise<SystemStats> {
    const cached = await this.redis.get(STATS_CACHE_KEY)
    if (cached) return JSON.parse(cached) as SystemStats

    const [[anime], [contributions], [users]] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.anime)
        .innerJoin(schema.entity, eq(schema.entity.id, schema.anime.id))
        .where(isNull(schema.entity.deletedAt)),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.changeset)
        .where(ne(schema.changeset.status, 'draft')),
      this.db.select({ count: sql<number>`count(*)::int` }).from(schema.user),
    ])

    const stats: SystemStats = {
      anime: anime?.count ?? 0,
      contributions: contributions?.count ?? 0,
      users: users?.count ?? 0,
    }

    await this.redis.set(
      STATS_CACHE_KEY,
      JSON.stringify(stats),
      'EX',
      STATS_CACHE_TTL_SECONDS,
    )
    return stats
  }
}
