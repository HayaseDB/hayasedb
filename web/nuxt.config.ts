import { config } from 'dotenv'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

config({ path: resolve(__dirname, '../.env') })

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  devServer: {
    port: parseInt(process.env.WEB_PORT || '8080'),
  },

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
    '@sidebase/nuxt-auth',
  ],

  auth: {
    baseURL: '/api/auth',
    provider: {
      type: 'local',
      endpoints: {
        signIn: { path: '/login', method: 'post' },
        signUp: { path: '/register', method: 'post' },
        signOut: { path: '/logout', method: 'post' },
        getSession: { path: '/session', method: 'get' },
      },
      token: {
        signInResponseTokenPointer: '/token',
        maxAgeInSeconds: 3600,
      },
      refresh: {
        isEnabled: true,
        endpoint: { path: '/refresh', method: 'post' },
        refreshOnlyToken: false,
        token: {
          signInResponseRefreshTokenPointer: '/refreshToken',
          refreshResponseTokenPointer: '/token',
          refreshRequestTokenPointer: '/refreshToken',
          maxAgeInSeconds: 604800,
        },
      },
      session: {
        dataType: {
          id: 'string',
          username: 'string',
          email: 'string',
          firstName: 'string',
          lastName: 'string',
          role: 'string',
        },
        dataResponsePointer: '/',
      },
      pages: {
        login: '/auth/login',
      },
    },
    globalAppMiddleware: {
      isEnabled: false,
    },
  },

  runtimeConfig: {
    apiUrl: process.env.WEB_API_URL || 'http://localhost:3000',
    public: {
      version: process.env.WEB_VERSION || 'dev',
    },
  },

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
        { name: 'apple-mobile-web-app-title', content: 'HayaseDB' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon/favicon-96x96.png', sizes: '96x96' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon/apple-touch-icon.png' },
        { rel: 'manifest', href: '/favicon/site.webmanifest' },
      ],
    },
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
})
