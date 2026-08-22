import type { ApiClient } from '../utils/orpc'

declare module '#app' {
  interface NuxtApp {
    $api: ApiClient
  }
}

export {}
