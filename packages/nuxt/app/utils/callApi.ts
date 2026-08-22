import { orpcErrorMessage } from './orpcError'

export interface CallApiOptions {
  title?: string
  fallback?: string
  success?: { title: string; description: string }
  onError?: (error: unknown) => boolean
}

export async function callApi<T>(
  fn: () => Promise<T>,
  {
    title,
    fallback = 'Please try again.',
    success,
    onError,
  }: CallApiOptions = {},
): Promise<T | null> {
  try {
    const result = await fn()
    if (success) useToast().add({ ...success, color: 'success' })
    return result
  } catch (error) {
    if (onError?.(error)) return null
    if (title) {
      useToast().add({
        title,
        description: orpcErrorMessage(error) ?? fallback,
        color: 'error',
      })
    }
    return null
  }
}
