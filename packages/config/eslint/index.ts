import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'
import type { ConfigArray } from 'typescript-eslint'

const SCRIPT_FILES = ['**/*.{ts,tsx,mts,cts,js,mjs,cjs}']

export const ignores: ConfigArray = tseslint.config({
  name: 'hayasedb/ignores',
  ignores: [
    '**/dist/**',
    '**/.nuxt/**',
    '**/.output/**',
    '**/.turbo/**',
    '**/drizzle/**',
    '**/node_modules/**',
  ],
})

const rules: ConfigArray = tseslint.config({
  name: 'hayasedb/rules',
  rules: {
    'no-undef': 'off',
  },
})

export const base: ConfigArray = tseslint.config(
  ...ignores,
  {
    name: 'hayasedb/base',
    files: SCRIPT_FILES,
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
  },
  ...rules,
  prettier,
)

export function nuxt<T>(withNuxt: (...configs: unknown[]) => T): T {
  return withNuxt(...ignores, ...rules, prettier)
}

export default base
