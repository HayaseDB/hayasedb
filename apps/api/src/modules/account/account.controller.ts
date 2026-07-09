import { Controller, Logger } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { fromNodeHeaders } from 'better-auth/node'
import { contract } from '@hayasedb/contract'
import { requireVerifiedUser } from '../../auth/require-verified-user'
import { AvatarService, InvalidImageError } from './avatar.service'

@Controller()
export class AccountController {
  private readonly logger = new Logger(AccountController.name)

  constructor(private readonly avatarService: AvatarService) {}

  @Implement(contract.account.uploadAvatar)
  uploadAvatar() {
    return implement(contract.account.uploadAvatar).handler(
      async ({ input, context, errors }) => {
        const userId = requireVerifiedUser(context, errors)

        const headers = fromNodeHeaders(context.request.headers)

        try {
          return await this.avatarService.upload(userId, headers, input.file)
        } catch (error) {
          if (error instanceof InvalidImageError) {
            throw errors.INPUT_VALIDATION_FAILED({
              message: error.message,
              data: {
                issues: [{ path: ['file'], message: error.message }],
              },
            })
          }
          this.logger.error(
            `Avatar upload failed for user ${userId}`,
            error instanceof Error ? error.stack : String(error),
          )
          throw errors.INTERNAL_SERVER_ERROR()
        }
      },
    )
  }
}
