import { createAnimeSeasonContract } from './create'
import { getAnimeSeasonContract } from './get'
import { listAnimeSeasonsContract } from './list'
import { removeAnimeSeasonContract } from './remove'
import { reorderAnimeSeasonsContract } from './reorder'
import { updateAnimeSeasonContract } from './update'

export const seasonContract = {
  list: listAnimeSeasonsContract,
  get: getAnimeSeasonContract,
  create: createAnimeSeasonContract,
  update: updateAnimeSeasonContract,
  remove: removeAnimeSeasonContract,
  reorder: reorderAnimeSeasonsContract,
}

export * from './create'
export * from './get'
export * from './list'
export * from './remove'
export * from './reorder'
export * from './update'
