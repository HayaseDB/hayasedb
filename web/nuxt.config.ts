// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  nitro: {
    compressPublicAssets: true,
  },

  modules: [
    '@nuxtjs/seo',
    '@nuxtjs/color-mode',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/hints',
    '@nuxt/icon',
    '@nuxt/image',
    'shadcn-nuxt',
  ],

  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  colorMode: {
    preference: 'system',
    fallback: 'dark',
    classSuffix: '',
  },

  site: {
    url: 'https://hayasedb.com',
    name: 'HayaseDB',
    description: 'Database for anime/manga',
    defaultLocale: 'en',
  },

  sitemap: {
    xslColumns: [
      { label: 'URL', width: '65%' },
      { label: 'Priority', width: '12%', select: 'sitemap:priority' },
      { label: 'Last Modified', width: '23%', select: 'sitemap:lastmod' },
    ],
    defaults: {
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date().toISOString(),
    },
    cacheMaxAgeSeconds: 3600,
    exclude: ['/api/**'],
  },

  ogImage: {
    enabled: true,
    defaults: {
      component: 'NuxtSeo',
      width: 1200,
      height: 630,
      cacheMaxAgeSeconds: 60,
    },
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'HayaseDB',
      url: 'https://hayasedb.com',
    },
  },

  linkChecker: {
    enabled: true,
    failOnError: false,
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'generator', content: 'Nuxt' },
        { name: 'rating', content: 'general' },
        { name: 'theme-color', content: '#09090b' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'referrer', content: 'strict-origin-when-cross-origin' },
        { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
})
