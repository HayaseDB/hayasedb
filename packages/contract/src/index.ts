import { pingContract } from './ping'

export const contract = {
  ping: pingContract,
}

export type Contract = typeof contract

export * from './ping'
