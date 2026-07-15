import type { ApiClient } from '../utils/orpc'

export function useApiClient(): ApiClient {
  return useNuxtApp().$api
}
