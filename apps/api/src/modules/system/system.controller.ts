import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { contract } from '@hayasedb/contract'

@Controller()
export class SystemController {
  @AllowAnonymous()
  @Implement(contract.system.ping)
  ping() {
    return implement(contract.system.ping).handler(({ input }) => ({
      ok: true as const,
      ts: Date.now(),
      echo: input.message,
    }))
  }
}
