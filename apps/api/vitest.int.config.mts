import { mergeConfig } from 'vitest/config'
import { integrationProject } from '../../vitest.presets.ts'
import { swcPlugin } from './vitest.swc.mts'

export default mergeConfig(
  integrationProject({
    name: 'api:integration',
    setupFiles: ['./test/setup.ts'],
    globalSetup: ['./test/global-setup.ts'],
  }),
  { plugins: [swcPlugin()] },
)
