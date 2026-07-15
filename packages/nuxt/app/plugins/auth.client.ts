import { createAppAuthClient } from '@hayasedb/auth/client'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      auth: createAppAuthClient(),
    },
  }
})
