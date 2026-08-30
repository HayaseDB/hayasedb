import { createAnimeEpisodeContract } from './create-for-anime'
import { createSeasonEpisodeContract } from './create-for-season'
import { getAnimeEpisodeContract } from './get'
import { listAnimeEpisodesContract } from './list-for-anime'
import { listSeasonEpisodesContract } from './list-for-season'
import { removeAnimeEpisodeContract } from './remove'
import { reorderAnimeEpisodesContract } from './reorder-for-anime'
import { reorderSeasonEpisodesContract } from './reorder-for-season'
import { updateAnimeEpisodeContract } from './update'

export const episodeContract = {
  listForAnime: listAnimeEpisodesContract,
  listForSeason: listSeasonEpisodesContract,
  get: getAnimeEpisodeContract,
  createForAnime: createAnimeEpisodeContract,
  createForSeason: createSeasonEpisodeContract,
  update: updateAnimeEpisodeContract,
  remove: removeAnimeEpisodeContract,
  reorderForAnime: reorderAnimeEpisodesContract,
  reorderForSeason: reorderSeasonEpisodesContract,
}

export * from './create-for-anime'
export * from './create-for-season'
export * from './get'
export * from './list-for-anime'
export * from './list-for-season'
export * from './remove'
export * from './reorder-for-anime'
export * from './reorder-for-season'
export * from './update'
