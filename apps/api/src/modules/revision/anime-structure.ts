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
      .selectDistinct({ animeId: schema.animeSeason.animeId })
      .from(schema.animeSeason)
      .where(inArray(schema.animeSeason.animeId, ids)),
    tx
      .selectDistinct({ animeId: schema.animeEpisode.animeId })
      .from(schema.animeEpisode)
      .where(
        and(
          isNotNull(schema.animeEpisode.animeId),
          inArray(schema.animeEpisode.animeId, ids),
        ),
      ),
  ])

  const withSeasons = new Set(seasons.map((row) => row.animeId))
  return episodes
    .filter((row) => row.animeId !== null && withSeasons.has(row.animeId))
    .map(
      (row) =>
        `Anime ${row.animeId} cannot contain both seasons and direct episodes`,
    )
}
