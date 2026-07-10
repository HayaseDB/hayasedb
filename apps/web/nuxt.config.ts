export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,

  extends: ['../../packages/nuxt', '../../packages/ui'],
  modules: ['@nuxt/ui', '@nuxt/eslint'],

  app: {
    head: {
      title: 'HayaseDB',
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },

  devServer: {
    port: Number(process.env.WEB_PORT) || 3001,
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
