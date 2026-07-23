import { pingContract } from './ping'
import { statsContract } from './stats'
import { versionContract } from './version'

export const systemContract = {
  ping: pingContract,
  stats: statsContract,
  version: versionContract,
}

export * from './ping'
export * from './stats'
export * from './version'
