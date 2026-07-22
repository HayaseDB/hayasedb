import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { contract } from '@hayasedb/contract'

const pkg = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
) as { name: string; version: string }

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

  @AllowAnonymous()
  @Implement(contract.system.version)
  version() {
    return implement(contract.system.version).handler(() => ({
      name: pkg.name,
      version: pkg.version,
    }))
  }
}
