import { pingContract } from './ping'
import { versionContract } from './version'

export const systemContract = {
  ping: pingContract,
  version: versionContract,
}

export * from './ping'
export * from './version'
