const hasControlChar = (value: string): boolean =>
  [...value].some((char) => {
    const code = char.charCodeAt(0)
    return code < 0x20 || code === 0x7f
  })

export function safeRedirectPath(value: unknown): string {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !hasControlChar(value)
    ? value
    : '/'
}
