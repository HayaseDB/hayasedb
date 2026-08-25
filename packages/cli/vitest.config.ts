import { nodeProject } from '../../vitest.presets.ts'

export default nodeProject({ name: 'cli', include: ['src/**/*.test.ts'] })
