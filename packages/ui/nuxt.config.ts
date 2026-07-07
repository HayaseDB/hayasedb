import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const layerDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: [join(layerDir, 'assets/css/main.css')],
  eslint: {
    config: {
      typescript: true,
    },
  },
})
