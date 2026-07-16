import { addChangesetNoteContract } from './add-note'
import { approveChangesetContract } from './approve'
import { getChangesetContract } from './get'
import { listChangesetsContract } from './list'
import { rejectChangesetContract } from './reject'
import { revertChangesetContract } from './revert'
import { changesetStatsContract } from './stats'
import { submitChangesetContract } from './submit'
import { withdrawChangesetContract } from './withdraw'

export const changesetContract = {
  list: listChangesetsContract,
  stats: changesetStatsContract,
  get: getChangesetContract,
  submit: submitChangesetContract,
  withdraw: withdrawChangesetContract,
  approve: approveChangesetContract,
  reject: rejectChangesetContract,
  revert: revertChangesetContract,
  addNote: addChangesetNoteContract,
}

export * from './add-note'
export * from './approve'
export * from './get'
export * from './list'
export * from './reject'
export * from './revert'
export * from './stats'
export * from './submit'
export * from './withdraw'
