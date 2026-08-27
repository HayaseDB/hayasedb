import { createGenreContract } from './create'
import { getGenreContract } from './get'
import { listGenresContract } from './list'
import { removeGenreContract } from './remove'
import { updateGenreContract } from './update'

export const genreContract = {
  list: listGenresContract,
  get: getGenreContract,
  create: createGenreContract,
  update: updateGenreContract,
  remove: removeGenreContract,
}

export * from './create'
export * from './get'
export * from './list'
export * from './remove'
export * from './update'
