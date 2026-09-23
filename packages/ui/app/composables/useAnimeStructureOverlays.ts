import {
  LazyAnimeEpisodeSlideover,
  LazyAnimeSeasonSlideover,
} from '#components'
import type { ChangeSet } from '#imports'
import type { EpisodeDraft, SeasonDraft } from '../utils/animeStructureForm'

export function useAnimeStructureOverlays(
  changes?: MaybeRefOrGetter<ChangeSet | undefined>,
) {
  const overlay = useOverlay()
  const episodeSlideover = overlay.create(LazyAnimeEpisodeSlideover)
  const seasonSlideover = overlay.create(LazyAnimeSeasonSlideover)

  function openEpisode(
    episodes: EpisodeDraft[],
    startIndex: number,
    context?: string,
  ) {
    episodeSlideover.open({
      episodes,
      startIndex,
      context,
      changes: () => toValue(changes),
    })
  }

  function openSeason(season: SeasonDraft) {
    seasonSlideover.open({ season, changes: () => toValue(changes) })
  }

  return { openEpisode, openSeason }
}
