import { isIP } from 'node:net'
import type { ConfigService } from '@nestjs/config'
import type { Env } from './env.schema'

export function sharedCookieDomain(
  config: ConfigService<Env, true>,
): string | undefined {
  const hosts = [
    new URL(config.get('WEB_PUBLIC_URL', { infer: true })).hostname,
    new URL(config.get('ADMIN_PUBLIC_URL', { infer: true })).hostname,
  ]
  if (hosts.some((host) => isIP(host))) return undefined

  const [webLabels, adminLabels] = hosts.map((host) =>
    host.split('.').reverse(),
  ) as [string[], string[]]

  const shared: string[] = []
  for (let i = 0; i < Math.min(webLabels.length, adminLabels.length); i++) {
    if (webLabels[i] !== adminLabels[i]) break
    shared.push(webLabels[i]!)
  }

  return shared.length >= 2 ? `.${shared.reverse().join('.')}` : undefined
}
