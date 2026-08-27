import { statsContract } from './stats'
import { versionContract } from './version'

export const systemContract = {
  stats: statsContract,
  version: versionContract,
}

export * from './stats'
export * from './version'
