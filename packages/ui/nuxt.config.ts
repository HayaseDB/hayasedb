import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const layerDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: [join(layerDir, 'assets/css/main.css')],
})
