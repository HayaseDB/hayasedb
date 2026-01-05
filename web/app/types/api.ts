export interface ApiError {
  data?: {
    message?: string
    data?: { message?: string }
  }
}

export function getErrorMessage(error: unknown, fallback: string): string {
  const err = error as ApiError
  return err?.data?.data?.message || err?.data?.message || fallback
}
