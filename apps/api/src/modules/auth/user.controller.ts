import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { contract } from '@hayasedb/contract'
import { RouteThrottle } from '../../auth/throttler'
import { forwardSetCookie } from '../../orpc/forward-set-cookie'
import { AuthFacade } from './auth.service'

@Controller()
export class UserController {
  constructor(private readonly auth: AuthFacade) {}

  @Implement(contract.auth.updateUser)
  updateUser() {
    return implement(contract.auth.updateUser).handler(
      async ({ input, context }) => {
        const { headers, response } = await this.auth.updateUser(
          context.request,
          input,
        )
        forwardSetCookie(context.request, headers)
        return { success: response.status }
      },
    )
  }

  @Implement(contract.auth.changeEmail)
  changeEmail() {
    return implement(contract.auth.changeEmail).handler(
      async ({ input, context }) => {
        const { headers, response } = await this.auth.changeEmail(
          context.request,
          input,
        )
        forwardSetCookie(context.request, headers)
        return { success: response.status }
      },
    )
  }

  @Implement(contract.auth.changePassword)
  changePassword() {
    return implement(contract.auth.changePassword).handler(
      async ({ input, context }) => {
        const { headers, response } = await this.auth.changePassword(
          context.request,
          input,
        )
        forwardSetCookie(context.request, headers)
        return response
      },
    )
  }

  @Implement(contract.auth.deleteUser)
  deleteUser() {
    return implement(contract.auth.deleteUser).handler(
      async ({ input, context }) => {
        const { headers, response } = await this.auth.deleteUser(
          context.request,
          input,
        )
        forwardSetCookie(context.request, headers)
        return response
      },
    )
  }

  @Implement(contract.auth.listSessions)
  listSessions() {
    return implement(contract.auth.listSessions).handler(
      async ({ context }) => {
        return await this.auth.listSessions(context.request)
      },
    )
  }

  @Implement(contract.auth.revokeSession)
  revokeSession() {
    return implement(contract.auth.revokeSession).handler(
      async ({ input, context }) => {
        const { headers, response } = await this.auth.revokeSession(
          context.request,
          input,
        )
        forwardSetCookie(context.request, headers)
        return { success: response.status }
      },
    )
  }

  @Implement(contract.auth.revokeOtherSessions)
  revokeOtherSessions() {
    return implement(contract.auth.revokeOtherSessions).handler(
      async ({ context }) => {
        const { headers, response } = await this.auth.revokeOtherSessions(
          context.request,
        )
        forwardSetCookie(context.request, headers)
        return { success: response.status }
      },
    )
  }

  @Implement(contract.auth.listAccounts)
  listAccounts() {
    return implement(contract.auth.listAccounts).handler(
      async ({ context }) => {
        return await this.auth.listUserAccounts(context.request)
      },
    )
  }

  @Implement(contract.auth.unlinkAccount)
  unlinkAccount() {
    return implement(contract.auth.unlinkAccount).handler(
      async ({ input, context }) => {
        const { headers, response } = await this.auth.unlinkAccount(
          context.request,
          input,
        )
        forwardSetCookie(context.request, headers)
        return { success: response.status }
      },
    )
  }

  @AllowAnonymous()
  @Implement(contract.auth.verifyEmail)
  verifyEmail() {
    return implement(contract.auth.verifyEmail).handler(
      async ({ input, context }) => {
        const { headers, response } = await this.auth.verifyEmail(
          context.request,
          input.token,
        )
        forwardSetCookie(context.request, headers)
        return { success: Boolean(response?.status) }
      },
    )
  }

  @AllowAnonymous()
  @RouteThrottle(30)
  @Implement(contract.auth.sendVerificationEmail)
  sendVerificationEmail() {
    return implement(contract.auth.sendVerificationEmail).handler(
      async ({ input, context }) => {
        const { headers, response } = await this.auth.sendVerificationEmail(
          context.request,
          input,
        )
        forwardSetCookie(context.request, headers)
        return { success: response.status }
      },
    )
  }

  @AllowAnonymous()
  @RouteThrottle(30)
  @Implement(contract.auth.requestPasswordReset)
  requestPasswordReset() {
    return implement(contract.auth.requestPasswordReset).handler(
      async ({ input, context }) => {
        const { headers, response } = await this.auth.requestPasswordReset(
          context.request,
          input,
        )
        forwardSetCookie(context.request, headers)
        return { success: response.status, message: response.message }
      },
    )
  }

  @AllowAnonymous()
  @Implement(contract.auth.resetPassword)
  resetPassword() {
    return implement(contract.auth.resetPassword).handler(
      async ({ input, context }) => {
        const { headers, response } = await this.auth.resetPassword(
          context.request,
          input,
        )
        forwardSetCookie(context.request, headers)
        return { success: response.status }
      },
    )
  }
}
