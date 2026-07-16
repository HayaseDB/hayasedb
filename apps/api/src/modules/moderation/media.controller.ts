import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { contract } from '@hayasedb/contract'
import { requireAdminUser } from '../../auth/require-admin'
import { requireVerifiedUser } from '../../auth/require-verified-user'
import { ContributionService } from '../contribution/contribution.service'
import { MediaGcService } from './media-gc.service'

@Controller()
export class MediaController {
  constructor(
    private readonly contributions: ContributionService,
    private readonly mediaGc: MediaGcService,
  ) {}

  @Implement(contract.media.upload)
  upload() {
    return implement(contract.media.upload).handler(({ input, context }) => {
      const userId = requireVerifiedUser(context)
      return this.contributions.uploadMedia(input.file, userId)
    })
  }

  @Implement(contract.media.sweep)
  sweep() {
    return implement(contract.media.sweep).handler(({ context }) => {
      requireAdminUser(context)
      return this.mediaGc.sweep()
    })
  }
}
