import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const layerDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint', 'motion-v/nuxt'],
  components: [{ path: join(layerDir, 'app/components'), pathPrefix: false }],
  alias: {
    '#ui-layer': join(layerDir, 'app'),
  },
  css: [join(layerDir, 'assets/css/main.css')],
  colorMode: {
    preference: 'light',
    fallback: 'light',
  },
  fonts: {
    families: [
      {
        name: 'Poppins',
        provider: 'google',
        weights: [400, 500, 600, 700],
        styles: ['normal'],
        preload: true,
      },
    ],
  },
  icon: {
    localApiEndpoint: '/_nuxt_icon',
  },
  eslint: {
    config: {
      typescript: true,
    },
  },
})
