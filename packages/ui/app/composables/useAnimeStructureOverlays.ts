import {
  LazyAnimeEpisodeSlideover,
  LazyAnimeSeasonSlideover,
} from '#components'
import type { EpisodeDraft, SeasonDraft } from '../utils/animeStructureForm'

export function useAnimeStructureOverlays() {
  const overlay = useOverlay()
  const episodeSlideover = overlay.create(LazyAnimeEpisodeSlideover)
  const seasonSlideover = overlay.create(LazyAnimeSeasonSlideover)

  function openEpisode(
    episodes: EpisodeDraft[],
    startIndex: number,
    context?: string,
  ) {
    episodeSlideover.open({ episodes, startIndex, context })
  }

  function openSeason(season: SeasonDraft) {
    seasonSlideover.open({ season })
  }

  return { openEpisode, openSeason }
}
