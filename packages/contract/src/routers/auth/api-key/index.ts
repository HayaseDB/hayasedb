import { apiKeyCreateContract } from './create'
import { apiKeyDeleteContract } from './delete'
import { apiKeyListContract } from './list'

export const apiKeyContract = {
  create: apiKeyCreateContract,
  list: apiKeyListContract,
  delete: apiKeyDeleteContract,
}

export * from './create'
export * from './delete'
export * from './list'
