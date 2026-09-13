import type { Column } from 'drizzle-orm'
import { sql, type SQL } from 'drizzle-orm'
import { LOCALE_RANK_BASES } from './locale-ranking'

export function localeRankSql(locale: Column, original: Column): SQL<number> {
  return sql<number>`case when ${locale} = 'en' then ${LOCALE_RANK_BASES.english} when ${original} then ${LOCALE_RANK_BASES.original} else ${LOCALE_RANK_BASES.fallback} end`
}
