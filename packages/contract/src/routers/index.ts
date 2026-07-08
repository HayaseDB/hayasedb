import { systemContract } from './system'

export const contract = {
  system: systemContract,
}

export type Contract = typeof contract

export * from './system'
