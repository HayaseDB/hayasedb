function orpcErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

export function isConflictError(error: unknown): boolean {
  return orpcErrorCode(error) === 'CONFLICT'
}
