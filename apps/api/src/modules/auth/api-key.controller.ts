import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { contract } from '@hayasedb/contract'
import { requireVerifiedUser } from '../../auth/require-user'
import { ApiKeyFacade } from './api-key.service'

@Controller()
export class ApiKeyController {
  constructor(private readonly apiKeys: ApiKeyFacade) {}

  @Implement(contract.auth.apiKey.create)
  create() {
    return implement(contract.auth.apiKey.create).handler(
      ({ input, context }) => {
        requireVerifiedUser(context)
        return this.apiKeys.create(context.request, input)
      },
    )
  }

  @Implement(contract.auth.apiKey.list)
  list() {
    return implement(contract.auth.apiKey.list).handler(({ context }) => {
      requireVerifiedUser(context)
      return this.apiKeys.list(context.request)
    })
  }

  @Implement(contract.auth.apiKey.delete)
  delete() {
    return implement(contract.auth.apiKey.delete).handler(
      ({ input, context }) => {
        requireVerifiedUser(context)
        return this.apiKeys.delete(context.request, input.id)
      },
    )
  }
}
