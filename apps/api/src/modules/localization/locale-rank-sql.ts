import type { Column } from 'drizzle-orm'
import { sql, type SQL } from 'drizzle-orm'
import { LOCALE_RANK_BASES, localeRanking } from './locale-ranking'

export function localeRankSql(
  locale: Column,
  original: Column,
  acceptLanguage?: string,
): SQL<number> {
  const ranking = localeRanking(acceptLanguage)

  const cases = [
    ...ranking.exact.map(
      (value, index) =>
        sql`when ${locale} = ${value} then ${LOCALE_RANK_BASES.exact + index}`,
    ),
    ...ranking.languages.map(
      (value, index) =>
        sql`when split_part(${locale}, '-', 1) = ${value} then ${LOCALE_RANK_BASES.language + index}`,
    ),
    sql`when ${locale} = 'en' then ${LOCALE_RANK_BASES.english}`,
    sql`when ${original} then ${LOCALE_RANK_BASES.original}`,
  ]

  return sql<number>`case ${sql.join(cases, sql` `)} else ${LOCALE_RANK_BASES.fallback} end`
}
