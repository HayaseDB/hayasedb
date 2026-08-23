import config from '@hayasedb/eslint-config/base'

export default [...config, { ignores: ['playwright-report', 'test-results'] }]
