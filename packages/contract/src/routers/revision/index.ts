import { getRevisionContract } from './get'
import { listRevisionsContract } from './list'
import { revertToRevisionContract } from './revert'

export const revisionContract = {
  list: listRevisionsContract,
  get: getRevisionContract,
  revert: revertToRevisionContract,
}

export * from './get'
export * from './list'
export * from './revert'
