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

export const base: ConfigArray = tseslint.config(
  ...ignores,
  {
    name: 'hayasedb/base',
    files: SCRIPT_FILES,
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      'no-undef': 'off',
    },
  },
  prettier,
)

export const vue: ConfigArray = tseslint.config({
  name: 'hayasedb/vue-ts-parser',
  files: ['**/*.vue'],
  languageOptions: {
    parserOptions: {
      parser: tseslint.parser,
    },
  },
})

export function nuxt<T extends { append: (...configs: unknown[]) => R }, R>(
  withNuxt: (...configs: unknown[]) => T,
): R {
  return withNuxt(...base).append(...vue)
}

export default base
