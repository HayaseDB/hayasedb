import { defineConfig, type UserConfig } from 'tsdown'

export function preset(options: UserConfig = {}): UserConfig {
  return defineConfig({
    format: 'esm',
    platform: 'node',
    target: 'node22',
    dts: true,
    unbundle: true,
    clean: true,
    ...options,
  })
}
