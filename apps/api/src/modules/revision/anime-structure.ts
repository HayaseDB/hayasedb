import { and, inArray, isNotNull } from 'drizzle-orm'
import { schema } from '@hayasedb/db'
import type { Tx } from './registry'

export async function findStructureConflicts(
  tx: Tx,
  animeIds: ReadonlyArray<string>,
): Promise<string[]> {
  const ids = [...new Set(animeIds)]
  if (ids.length === 0) return []

  const [seasons, episodes] = await Promise.all([
    tx
      .select({
        animeId: schema.animeSeason.animeId,
        position: schema.animeSeason.position,
      })
      .from(schema.animeSeason)
      .where(inArray(schema.animeSeason.animeId, ids)),
    tx
      .select({
        animeId: schema.animeEpisode.animeId,
        position: schema.animeEpisode.position,
      })
      .from(schema.animeEpisode)
      .where(
        and(
          isNotNull(schema.animeEpisode.animeId),
          inArray(schema.animeEpisode.animeId, ids),
        ),
      ),
  ])

  const seen = new Map<string, number>()
  const problems: string[] = []

  for (const row of [...seasons, ...episodes]) {
    if (row.animeId === null) continue
    const key = `${row.animeId}:${row.position}`
    const count = (seen.get(key) ?? 0) + 1
    seen.set(key, count)
    if (count === 2) {
      problems.push(
        `Anime ${row.animeId} has more than one season or direct episode at position ${row.position}`,
      )
    }
  }

  return problems
}
