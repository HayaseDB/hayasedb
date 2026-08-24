import { preset } from '@hayasedb/typescript-config/tsdown'

export default preset({
  entry: ['src/index.ts'],
  onSuccess: 'bun run ./src/openapi.emit.ts',
})
