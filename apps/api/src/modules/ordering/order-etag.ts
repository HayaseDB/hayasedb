import { createHash } from 'node:crypto'

export function orderEtag(ids: readonly string[]): string {
  return `"${createHash('sha256').update(ids.join('\0')).digest('base64url')}"`
}
