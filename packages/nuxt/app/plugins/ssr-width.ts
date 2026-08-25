import { breakpointsTailwind, provideSSRWidth } from '@vueuse/core'

export default defineNuxtPlugin((nuxtApp) => {
  provideSSRWidth(breakpointsTailwind.lg, nuxtApp.vueApp)
})
