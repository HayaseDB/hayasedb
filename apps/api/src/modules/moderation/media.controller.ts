import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { contract } from '@hayasedb/contract'
import { requireVerifiedUser } from '../../auth/require-verified-user'
import { ContributionService } from '../contribution/contribution.service'

@Controller()
export class MediaController {
  constructor(private readonly contributions: ContributionService) {}

  @Implement(contract.media.upload)
  upload() {
    return implement(contract.media.upload).handler(({ input, context }) => {
      const userId = requireVerifiedUser(context)
      return this.contributions.uploadMedia(input.file, userId)
    })
  }
}
