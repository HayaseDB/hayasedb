const info = console.info.bind(console)

console.info = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].startsWith('<Suspense> is an experimental feature')
  ) {
    return
  }
  info(...args)
}
