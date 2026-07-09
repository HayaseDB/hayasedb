export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,

  extends: ['../../packages/nuxt', '../../packages/ui'],
  modules: ['@nuxt/ui', '@nuxt/eslint'],

  devServer: {
    port: Number(process.env.ADMIN_PORT) || 3002,
  },

  vite: {
    server: {
      strictPort: true,
    },
    optimizeDeps: {
      include: [
        '@orpc/client',
        '@orpc/openapi/extensions/route',
        '@orpc/openapi/fetch',
        'better-auth/client/plugins',
        'better-auth/vue',
        'zod',
      ],
      exclude: ['@hayasedb/contract'],
    },
  },
})
