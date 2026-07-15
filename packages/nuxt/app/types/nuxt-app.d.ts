import type { ApiClient } from '../utils/orpc'
import type { AppAuthClient } from '@hayasedb/auth'

declare module '#app' {
  interface NuxtApp {
    $api: ApiClient
    $auth: AppAuthClient
  }
}

export {}
