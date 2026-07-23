import { isDraining, startDraining } from '../utils/shutdown-state'

export default defineNitroPlugin((nitroApp) => {
  if (!process.env.NITRO_SHUTDOWN_DISABLED) return

  const drainMs = Number(process.env.SHUTDOWN_DRAIN_MS ?? 0)

  const shutdown = (signal: string) => {
    if (isDraining()) return
    startDraining()
    console.log(`[shutdown] ${signal} received, draining for ${drainMs}ms`)
    setTimeout(() => {
      nitroApp.hooks
        .callHook('close')
        .catch((error) => console.error(error))
        .finally(() => process.exit(0))
    }, drainMs)
  }

  process.once('SIGTERM', () => shutdown('SIGTERM'))
  process.once('SIGINT', () => shutdown('SIGINT'))
})
