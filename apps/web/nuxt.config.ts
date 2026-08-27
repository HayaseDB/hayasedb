import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { mkdirSync, copyFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from './package.json'

const appDir = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const scalarPackageDir = dirname(
  dirname(require.resolve('@scalar/api-reference/style.css')),
)
const scalarBundle = join(
  scalarPackageDir,
  (
    JSON.parse(
      readFileSync(join(scalarPackageDir, 'package.json'), 'utf8'),
    ) as { browser: string }
  ).browser,
)

const scalarPublicDir = join(appDir, '.scalar')
mkdirSync(scalarPublicDir, { recursive: true })
copyFileSync(scalarBundle, join(scalarPublicDir, 'standalone.js'))

const SITE_DESCRIPTION =
  'The open anime database. Built and reviewed by the community, free to explore and free to use through an open API.'

const ogImageSecret = createHash('sha256')
  .update(`hayasedb:og-image:${process.env.GIT_SHA || pkg.version}`)
  .digest('hex')

const siteUrl =
  process.env.NUXT_SITE_URL ||
  process.env.NUXT_PUBLIC_WEB_URL ||
  process.env.WEB_PUBLIC_URL ||
  'http://localhost:3001'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,

  extends: ['@hayasedb/nuxt', '@hayasedb/ui'],
  modules: ['@nuxt/ui', '@nuxt/eslint', '@nuxtjs/seo'],

  runtimeConfig: {
    public: {
      appVersion: pkg.version,
    },
  },

  site: {
    url: siteUrl,
    name: 'HayaseDB',
    description: SITE_DESCRIPTION,
    defaultLocale: 'en',
    separator: '·',
  },

  seo: {
    fallbackTitle: false,
  },

  ogImage: {
    security: {
      secret: ogImageSecret,
    },
    defaults: {
      width: 1200,
      height: 630,
    },
  },

  robots: {
    disallow: [
      '/settings',
      '/api-keys',
      '/contribute',
      '/contributions',
      '/auth',
      '/login',
      '/register',
      '/api/*',
      '/_reference',
      '/openapi.json',
      '/_docs',
    ],
  },

  sitemap: {
    exclude: [
      '/settings',
      '/api-keys',
      '/contribute/**',
      '/contributions/**',
      '/auth/**',
      '/login',
      '/register',
    ],
    sources: ['/__sitemap__/urls'],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
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

  nitro: {
    publicAssets: [
      { dir: scalarPublicDir, baseURL: '/_docs', maxAge: 31536000 },
    ],
  },

  vite: {
    server: {
      strictPort: true,
    },
  },
})
