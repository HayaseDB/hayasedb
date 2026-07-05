import { readFileSync } from 'node:fs'

export function readSecret(
  env: NodeJS.ProcessEnv,
  key: string,
): string | undefined {
  const filePath = env[`${key}_FILE`]
  if (filePath) {
    return readFileSync(filePath, 'utf8').trim()
  }
  return env[key]
}
