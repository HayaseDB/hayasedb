import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const layerDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],

  runtimeConfig: {
    apiUrl: 'http://localhost:3000',
  },

  eslint: {
    config: {
      typescript: true,
    },
  },
  alias: {
    '#shared': join(layerDir, 'app'),
  },
  nitro: {
    moduleSideEffects: ['@orpc/openapi'],
  },
  vite: {
    optimizeDeps: {
      include: [
        '@orpc/client',
        '@orpc/contract',
        '@orpc/openapi/extensions/route',
        '@orpc/openapi/fetch',
        '@vueuse/core',
        'better-auth/client/plugins',
        'better-auth/vue',
        'zod',
      ],
      exclude: ['@hayasedb/auth', '@hayasedb/contract', '@hayasedb/domain'],
    },
  },
})
