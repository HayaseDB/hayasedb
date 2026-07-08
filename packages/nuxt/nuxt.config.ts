import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const layerDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  eslint: {
    config: {
      typescript: true,
    },
  },
  alias: {
    '#shared': join(layerDir, 'app'),
  },
  vite: {
    optimizeDeps: {
      include: [
        '@hayasedb/contract',
        '@orpc/client',
        '@orpc/openapi/extensions/route',
        '@orpc/openapi/fetch',
        'better-auth/client/plugins',
        'better-auth/vue',
        'zod',
      ],
    },
  },
})
