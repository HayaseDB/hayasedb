import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { contract } from '@hayasedb/contract'
import { requireAdminUser } from '../../auth/require-admin'
import { ModerationService } from './moderation.service'
import { HistoryService } from '../history/history.service'

@Controller()
export class RevisionController {
  constructor(
    private readonly history: HistoryService,
    private readonly moderation: ModerationService,
  ) {}

  @Implement(contract.revision.list)
  list() {
    return implement(contract.revision.list).handler(({ input, context }) => {
      requireAdminUser(context)
      return this.history.listRevisions(input)
    })
  }

  @Implement(contract.revision.get)
  get() {
    return implement(contract.revision.get).handler(({ input, context }) => {
      requireAdminUser(context)
      return this.history.getRevision(input.id)
    })
  }

  @Implement(contract.revision.revert)
  revert() {
    return implement(contract.revision.revert).handler(({ input, context }) => {
      const adminId = requireAdminUser(context)
      return this.moderation.revertToRevision(input.id, adminId)
    })
  }
}
