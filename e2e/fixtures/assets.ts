import { fileURLToPath } from 'node:url'

export const COVER_FIXTURE = {
  path: fileURLToPath(new URL('../assets/cover.png', import.meta.url)),
  width: 64,
  height: 96,
} as const
