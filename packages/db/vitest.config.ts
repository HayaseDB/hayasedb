import { nodeProject } from '../../vitest.presets.ts'

export default nodeProject({ name: 'db', include: ['src/**/*.test.ts'] })
