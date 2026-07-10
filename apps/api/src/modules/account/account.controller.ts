import { Controller, Logger } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { AuthService } from '@thallesp/nestjs-better-auth'
import { fromNodeHeaders } from 'better-auth/node'
import { contract } from '@hayasedb/contract'
import type { Auth } from '../../auth/auth'
import { requireVerifiedUser } from '../../auth/require-verified-user'
import { AvatarService, InvalidImageError } from './avatar.service'

@Controller()
export class AccountController {
  private readonly logger = new Logger(AccountController.name)

  constructor(
    private readonly avatarService: AvatarService,
    private readonly auth: AuthService<Auth>,
  ) {}

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

  @Implement(contract.account.setPassword)
  setPassword() {
    return implement(contract.account.setPassword).handler(
      async ({ input, context, errors }) => {
        const userId = requireVerifiedUser(context, errors)

        const headers = fromNodeHeaders(context.request.headers)

        try {
          await this.auth.api.setPassword({
            body: { newPassword: input.newPassword },
            headers,
          })
          return { success: true }
        } catch (error) {
          if (
            error instanceof Error &&
            'body' in error &&
            (error as { body?: { code?: string } }).body?.code ===
              'PASSWORD_ALREADY_SET'
          ) {
            throw errors.CONFLICT({
              message: 'You already have a password set.',
            })
          }
          this.logger.error(
            `Set password failed for user ${userId}`,
            error instanceof Error ? error.stack : String(error),
          )
          throw errors.INTERNAL_SERVER_ERROR()
        }
      },
    )
  }
}
