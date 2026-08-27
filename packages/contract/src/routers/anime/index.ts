import { addAnimeMediaContract } from './add-media'
import { createAnimeContract } from './create'
import { getAnimeContract } from './get'
import { listAnimeContract } from './list'
import { removeAnimeContract } from './remove'
import { removeAnimeMediaContract } from './remove-media'
import { reorderAnimeMediaContract } from './reorder-media'
import { updateAnimeContract } from './update'

export const animeContract = {
  list: listAnimeContract,
  get: getAnimeContract,
  create: createAnimeContract,
  update: updateAnimeContract,
  remove: removeAnimeContract,
  addMedia: addAnimeMediaContract,
  removeMedia: removeAnimeMediaContract,
  reorderMedia: reorderAnimeMediaContract,
}

export * from './add-media'
export * from './create'
export * from './get'
export * from './list'
export * from './remove'
export * from './remove-media'
export * from './reorder-media'
export * from './update'
