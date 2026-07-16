import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { contract } from '@hayasedb/contract'
import { requireAdminUser } from '../../auth/require-admin'
import { requireVerifiedUser } from '../../auth/require-verified-user'
import { ModerationService } from './moderation.service'
import { ContributionService } from '../contribution/contribution.service'

@Controller()
export class ChangesetController {
  constructor(
    private readonly contributions: ContributionService,
    private readonly moderation: ModerationService,
  ) {}

  @Implement(contract.changeset.list)
  list() {
    return implement(contract.changeset.list).handler(({ input, context }) => {
      const { mine, ...filter } = input
      if (mine) {
        const userId = requireVerifiedUser(context)
        return this.contributions.listMine(userId, filter)
      }
      requireAdminUser(context)
      return this.moderation.listChangesets({
        ...filter,
        status: filter.status ?? 'pending',
      })
    })
  }

  @Implement(contract.changeset.stats)
  stats() {
    return implement(contract.changeset.stats).handler(({ context }) => {
      requireAdminUser(context)
      return this.moderation.counts()
    })
  }

  @Implement(contract.changeset.get)
  get() {
    return implement(contract.changeset.get).handler(({ input, context }) => {
      const userId = requireVerifiedUser(context)
      const isAdmin = context.request.user?.role === 'admin'
      return this.contributions.get(input.id, userId, isAdmin)
    })
  }

  @Implement(contract.changeset.submit)
  submit() {
    return implement(contract.changeset.submit).handler(
      ({ input, context }) => {
        const userId = requireVerifiedUser(context)
        return this.contributions.submit(input, userId)
      },
    )
  }

  @Implement(contract.changeset.withdraw)
  withdraw() {
    return implement(contract.changeset.withdraw).handler(
      ({ input, context }) => {
        const userId = requireVerifiedUser(context)
        return this.contributions.withdraw(input.id, userId)
      },
    )
  }

  @Implement(contract.changeset.addNote)
  addNote() {
    return implement(contract.changeset.addNote).handler(
      ({ input, context }) => {
        const userId = requireVerifiedUser(context)
        const isAdmin = context.request.user?.role === 'admin'
        return this.contributions.addNote(input.id, userId, input.body, isAdmin)
      },
    )
  }

  @Implement(contract.changeset.approve)
  approve() {
    return implement(contract.changeset.approve).handler(
      ({ input, context }) => {
        const adminId = requireAdminUser(context)
        return this.moderation.approve(input.id, adminId)
      },
    )
  }

  @Implement(contract.changeset.reject)
  reject() {
    return implement(contract.changeset.reject).handler(
      ({ input, context }) => {
        const adminId = requireAdminUser(context)
        return this.moderation.reject(input.id, input.note, adminId)
      },
    )
  }

  @Implement(contract.changeset.revert)
  revert() {
    return implement(contract.changeset.revert).handler(
      ({ input, context }) => {
        const adminId = requireAdminUser(context)
        return this.moderation.revertChangeset(input.id, adminId, input.summary)
      },
    )
  }
}
