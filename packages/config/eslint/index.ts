import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

const SCRIPT_FILES = ['**/*.{ts,tsx,mts,cts,js,mjs,cjs}']

export const ignores = tseslint.config({
  ignores: [
    '**/dist/**',
    '**/.nuxt/**',
    '**/.output/**',
    '**/.turbo/**',
    '**/drizzle/**',
    '**/node_modules/**',
  ],
})

export const base = tseslint.config(
  ...ignores,
  {
    files: SCRIPT_FILES,
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      'no-undef': 'off',
    },
  },
  prettier,
)

export default base
