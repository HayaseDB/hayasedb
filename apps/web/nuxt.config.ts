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

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,

  extends: ['@hayasedb/nuxt', '@hayasedb/ui'],
  modules: ['@nuxt/ui', '@nuxt/eslint'],

  runtimeConfig: {
    public: {
      appVersion: pkg.version,
    },
  },

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
