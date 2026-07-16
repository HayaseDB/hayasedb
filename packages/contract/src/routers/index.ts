import { accountContract } from './account'
import { animeContract } from './anime'
import { changesetContract } from './changeset'
import { genreContract } from './genre'
import { mediaContract } from './media'
import { revisionContract } from './revision'
import { systemContract } from './system'

export const contract = {
  system: systemContract,
  account: accountContract,
  anime: animeContract,
  genre: genreContract,
  changeset: changesetContract,
  revision: revisionContract,
  media: mediaContract,
}

export type Contract = typeof contract

export * from './account'
export * from './anime'
export * from './changeset'
export * from './genre'
export * from './media'
export * from './revision'
export * from './system'
