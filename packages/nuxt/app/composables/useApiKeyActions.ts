import type { ApiClient } from '../utils/orpc'

export interface CreateApiKeyInput {
  name: string
  expiresIn: number | null
}

export type CreatedApiKey = Awaited<
  ReturnType<ApiClient['auth']['apiKey']['create']>
>

export function useApiKeyActions() {
  const api = useApiClient()
  const { loading, run } = useApiAction()

  function createKey(input: CreateApiKeyInput): Promise<CreatedApiKey | null> {
    return run(() => api.auth.apiKey.create(input), {
      title: 'Could not create API key',
      success: {
        title: 'API key created',
        description: 'Copy it now, it will not be shown again.',
      },
    })
  }

  async function deleteKey(id: string): Promise<boolean> {
    return Boolean(
      await run(() => api.auth.apiKey.delete({ id }), {
        title: 'Could not delete API key',
        success: {
          title: 'API key deleted',
          description: 'Requests using this key will stop working immediately.',
        },
      }),
    )
  }

  return { loading, createKey, deleteKey }
}
