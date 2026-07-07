import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { Session } from '@thallesp/nestjs-better-auth'
import { contract } from '@hayasedb/contract'
import type { Session as UserSession } from '../../orpc/context'

@Controller()
export class MeController {
  @Implement(contract.me)
  me(@Session() session: UserSession) {
    return implement(contract.me).handler(() => {
      const { user } = session
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: Array.isArray(user.role)
          ? user.role.join(',')
          : (user.role ?? null),
      }
    })
  }
}
