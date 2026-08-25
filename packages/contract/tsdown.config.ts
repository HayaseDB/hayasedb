import { preset } from '@hayasedb/typescript-config/tsdown'

export default preset({
  entry: ['src/index.ts'],
  clean: ['dist/**', '!dist/openapi.public.json'],
  onSuccess: 'bun run ./src/openapi.emit.ts',
})
