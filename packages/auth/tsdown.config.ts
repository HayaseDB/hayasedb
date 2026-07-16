import { preset } from '@hayasedb/typescript-config/tsdown'

export default preset({
  entry: ['src/index.ts', 'src/client.ts'],
  deps: { neverBundle: 'vue' },
  dts: false,
})
