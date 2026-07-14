import { accountContract } from './account'
import { animeContract } from './anime'
import { genreContract } from './genre'
import { systemContract } from './system'

export const contract = {
  system: systemContract,
  account: accountContract,
  anime: animeContract,
  genre: genreContract,
}

export type Contract = typeof contract

export * from './account'
export * from './anime'
export * from './genre'
export * from './system'
