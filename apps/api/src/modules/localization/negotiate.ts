import type { ORPCContext } from '../../orpc/context'

export function negotiatedLanguage(context: ORPCContext): string | undefined {
  context.resHeaders?.append('Vary', 'Accept-Language')
  const value = context.request.headers['accept-language']
  return typeof value === 'string' ? value : undefined
}
