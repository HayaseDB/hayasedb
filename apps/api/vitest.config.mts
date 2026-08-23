import { mergeConfig } from 'vitest/config'
import { nodeProject } from '../../vitest.presets.ts'
import { swcPlugin } from './vitest.swc.mts'

export default mergeConfig(
  nodeProject({
    name: 'api',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
  }),
  { plugins: [swcPlugin()] },
)
