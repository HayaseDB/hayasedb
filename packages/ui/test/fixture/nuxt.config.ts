export default defineNuxtConfig({
  extends: ['../../'],
  modules: ['@nuxt/ui'],
  ssr: false,
  fonts: { providers: { google: false } },
})
