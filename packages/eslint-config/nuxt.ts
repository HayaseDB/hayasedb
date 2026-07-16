import prettier from 'eslint-config-prettier'

import { ignores, rules } from './base'

export function nuxt<T>(withNuxt: (...configs: unknown[]) => T): T {
  return withNuxt(...ignores, ...rules, prettier)
}

export default nuxt
