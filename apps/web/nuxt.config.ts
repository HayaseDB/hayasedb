export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,

  extends: ['../../packages/nuxt', '../../packages/ui'],
  modules: ['@nuxt/ui', '@nuxt/eslint'],

  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3000',
    },
  },

  nitro: {
    routeRules: {
      '/api/auth/**': {
        proxy: `${process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/**`,
      },
      '/api/**': {
        proxy: `${process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/**`,
      },
    },
  },

  devServer: {
    port: Number(process.env.WEB_PORT) || 3001,
  },

  vite: {
    server: {
      strictPort: true,
      hmr: {
        port: 24679,
        clientPort: 24679,
      },
    },
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
