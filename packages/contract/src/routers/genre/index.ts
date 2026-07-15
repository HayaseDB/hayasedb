import { createGenreContract } from './create'
import { listGenresContract } from './list'
import { removeGenreContract } from './remove'
import { updateGenreContract } from './update'

export const genreContract = {
  list: listGenresContract,
  create: createGenreContract,
  update: updateGenreContract,
  remove: removeGenreContract,
}

export * from './create'
export * from './list'
export * from './remove'
export * from './update'
