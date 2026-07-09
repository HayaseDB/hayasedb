import { accountContract } from './account'
import { systemContract } from './system'

export const contract = {
  system: systemContract,
  account: accountContract,
}

export type Contract = typeof contract

export * from './account'
export * from './system'
