import { fileURLToPath } from 'node:url'

export const ADMIN_STORAGE_STATE = fileURLToPath(
  new URL('../.auth/admin.json', import.meta.url),
)
