import { accountContract } from './account'
import { animeContract } from './anime'
import { authContract } from './auth'
import { changesetContract } from './changeset'
import { episodeContract } from './episode'
import { genreContract } from './genre'
import { mediaContract } from './media'
import { revisionContract } from './revision'
import { seasonContract } from './season'
import { systemContract } from './system'

export const contract = {
  system: systemContract,
  auth: authContract,
  account: accountContract,
  anime: animeContract,
  season: seasonContract,
  episode: episodeContract,
  genre: genreContract,
  changeset: changesetContract,
  revision: revisionContract,
  media: mediaContract,
}

export type Contract = typeof contract

export * from './account'
export * from './anime'
export * from './auth'
export * from './changeset'
export * from './episode'
export * from './genre'
export * from './media'
export * from './revision'
export * from './season'
export * from './system'
