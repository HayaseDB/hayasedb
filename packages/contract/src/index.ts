import { meContract } from './me'
import { pingContract } from './ping'

export const contract = {
  me: meContract,
  ping: pingContract,
}

export type Contract = typeof contract

export * from './me'
export * from './ping'
