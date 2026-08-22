import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { Roles } from '@thallesp/nestjs-better-auth'
import { contract } from '@hayasedb/contract'
import { AdminFacade } from './admin.service'

@Roles(['admin'])
@Controller()
export class AdminController {
  constructor(private readonly admin: AdminFacade) {}

  @Implement(contract.auth.admin.listUsers)
  listUsers() {
    return implement(contract.auth.admin.listUsers).handler(
      ({ input, context }) => this.admin.listUsers(context.request, input),
    )
  }

  @Implement(contract.auth.admin.getUser)
  getUser() {
    return implement(contract.auth.admin.getUser).handler(
      ({ input, context }) => this.admin.getUser(context.request, input.id),
    )
  }

  @Implement(contract.auth.admin.listUserSessions)
  listUserSessions() {
    return implement(contract.auth.admin.listUserSessions).handler(
      async ({ input, context }) => {
        const { sessions } = await this.admin.listUserSessions(
          context.request,
          input.id,
        )
        return sessions
      },
    )
  }

  @Implement(contract.auth.admin.createUser)
  createUser() {
    return implement(contract.auth.admin.createUser).handler(
      ({ input, context }) => this.admin.createUser(context.request, input),
    )
  }

  @Implement(contract.auth.admin.updateUser)
  updateUser() {
    return implement(contract.auth.admin.updateUser).handler(
      async ({ input, context }) => {
        const { id, ...data } = input
        const user = await this.admin.updateUser(context.request, {
          userId: id,
          data,
        })
        return { user }
      },
    )
  }

  @Implement(contract.auth.admin.setRole)
  setRole() {
    return implement(contract.auth.admin.setRole).handler(
      ({ input, context }) =>
        this.admin.setRole(context.request, {
          userId: input.id,
          role: input.role,
        }),
    )
  }

  @Implement(contract.auth.admin.setUserPassword)
  setUserPassword() {
    return implement(contract.auth.admin.setUserPassword).handler(
      async ({ input, context }) => {
        const { status } = await this.admin.setUserPassword(context.request, {
          userId: input.id,
          newPassword: input.newPassword,
        })
        return { success: status }
      },
    )
  }

  @Implement(contract.auth.admin.banUser)
  banUser() {
    return implement(contract.auth.admin.banUser).handler(
      ({ input, context }) =>
        this.admin.banUser(context.request, {
          userId: input.id,
          banReason: input.reason,
          banExpiresIn: input.expiresIn,
        }),
    )
  }

  @Implement(contract.auth.admin.unbanUser)
  unbanUser() {
    return implement(contract.auth.admin.unbanUser).handler(
      ({ input, context }) =>
        this.admin.unbanUser(context.request, { userId: input.id }),
    )
  }

  @Implement(contract.auth.admin.revokeUserSession)
  revokeUserSession() {
    return implement(contract.auth.admin.revokeUserSession).handler(
      ({ input, context }) =>
        this.admin.revokeUserSession(context.request, input.sessionToken),
    )
  }

  @Implement(contract.auth.admin.revokeUserSessions)
  revokeUserSessions() {
    return implement(contract.auth.admin.revokeUserSessions).handler(
      ({ input, context }) =>
        this.admin.revokeUserSessions(context.request, input.id),
    )
  }

  @Implement(contract.auth.admin.removeUser)
  removeUser() {
    return implement(contract.auth.admin.removeUser).handler(
      ({ input, context }) => this.admin.removeUser(context.request, input.id),
    )
  }
}
