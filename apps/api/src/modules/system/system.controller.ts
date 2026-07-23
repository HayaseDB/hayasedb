import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { contract } from '@hayasedb/contract'
import { SystemService } from './system.service'

const pkg = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
) as { name: string; version: string }

function resolveCommit(): string {
  if (process.env.GIT_SHA) return process.env.GIT_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

const commit = resolveCommit()

@Controller()
export class SystemController {
  constructor(private readonly system: SystemService) {}

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
      commit,
    }))
  }

  @AllowAnonymous()
  @Implement(contract.system.stats)
  stats() {
    return implement(contract.system.stats).handler(() => this.system.stats())
  }
}
