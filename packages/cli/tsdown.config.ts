import { preset } from '@hayasedb/typescript-config/tsdown'

export default preset({
  entry: ['src/main.ts'],
  dts: false,
  copy: [{ from: 'src/seed/sets/demo/assets', to: 'dist/seed/sets/demo' }],
})
