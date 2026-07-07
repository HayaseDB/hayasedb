export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,

  extends: ['../../packages/ui'],
  modules: ['@nuxt/ui', '@nuxt/eslint'],

  runtimeConfig: {
    public: {
      apiUrl: 'http://localhost:3000',
    },
  },

  devServer: {
    port: Number(process.env.ADMIN_PORT) || 3002,
  },

  vite: {
    server: {
      hmr: {
        port: 24680,
      },
    },
    optimizeDeps: {
      include: [
        '@hayasedb/contract',
        '@orpc/client',
        '@orpc/openapi/extensions/route',
        '@orpc/openapi/fetch',
        'zod',
      ],
    },
  },
})
