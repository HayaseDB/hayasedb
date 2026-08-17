export interface CreateApiKeyInput {
  name: string
  expiresIn: number | null
}

type AppAuth = ReturnType<typeof useAuth>
export type CreatedApiKey = NonNullable<
  Awaited<ReturnType<AppAuth['apiKey']['create']>>['data']
>

export function useApiKeyActions() {
  const auth = useAuth()
  const toast = useToast()

  const loading = ref(false)

  async function createKey(
    input: CreateApiKeyInput,
  ): Promise<CreatedApiKey | null> {
    loading.value = true
    try {
      const { data, error } = await auth.apiKey.create({
        name: input.name,
        expiresIn: input.expiresIn,
      })

      if (error || !data) {
        toast.add({
          title: 'Could not create API key',
          description: error?.message ?? 'Please try again.',
          color: 'error',
        })
        return null
      }

      toast.add({
        title: 'API key created',
        description: 'Copy it now, it will not be shown again.',
        color: 'success',
      })
      return data
    } finally {
      loading.value = false
    }
  }

  async function deleteKey(keyId: string): Promise<boolean> {
    loading.value = true
    try {
      const { error } = await auth.apiKey.delete({ keyId })

      if (error) {
        toast.add({
          title: 'Could not delete API key',
          description: error.message ?? 'Please try again.',
          color: 'error',
        })
        return false
      }

      toast.add({
        title: 'API key deleted',
        description: 'Requests using this key will stop working immediately.',
        color: 'success',
      })
      return true
    } finally {
      loading.value = false
    }
  }

  return { loading, createKey, deleteKey }
}
