import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const layerDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],

  devServer: {
    host: process.env.NITRO_HOST ?? '0.0.0.0',
  },

  runtimeConfig: {
    apiUrl: 'http://localhost:3000',
    internalToken: '',
    bffProfile: 'web',
    public: {
      appVersion: '0.0.0',
      gitSha: process.env.GIT_SHA?.slice(0, 7) ?? '',
      webUrl: 'http://localhost:3001',
      adminUrl: 'http://localhost:3002',
      apiDocsUrl: 'http://localhost:3000/docs',
    },
  },

  experimental: {
    checkOutdatedBuildInterval: 10_000,
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
        '@better-auth/api-key/client',
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
