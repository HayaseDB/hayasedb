import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export function loadDotenv(startDir: string = process.cwd()): void {
  let dir = startDir
  for (;;) {
    const candidate = join(dir, '.env')
    if (existsSync(candidate)) {
      applyDotenv(readFileSync(candidate, 'utf8'))
      return
    }
    const parent = dirname(dir)
    if (parent === dir) return
    dir = parent
  }
}

function applyDotenv(contents: string): void {
  for (const raw of contents.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    if (key in process.env) continue
    let value = line.slice(eq + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    } else {
      const hash = value.indexOf(' #')
      if (hash !== -1) value = value.slice(0, hash).trim()
    }

    process.env[key] = value
  }
}
