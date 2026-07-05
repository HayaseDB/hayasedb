import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['env/index.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node22',
  dts: true,
  unbundle: true,
  clean: true,
})
