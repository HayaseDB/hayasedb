const CHANNEL = 'hayasedb:session'
const SIGNAL = 'changed'

let channel: BroadcastChannel | undefined

function sessionChannel(): BroadcastChannel | undefined {
  if (!import.meta.client || typeof BroadcastChannel === 'undefined') return
  return (channel ??= new BroadcastChannel(CHANNEL))
}

export async function refreshAppSession({
  broadcast = true,
}: { broadcast?: boolean } = {}): Promise<void> {
  await refreshNuxtData('app-session')
  if (broadcast) sessionChannel()?.postMessage(SIGNAL)
}

export function onSessionChanged(handler: () => void): () => void {
  const bc = sessionChannel()
  if (!bc) return () => {}

  const listener = (event: MessageEvent) => {
    if (event.data === SIGNAL) handler()
  }
  bc.addEventListener('message', listener)
  return () => bc.removeEventListener('message', listener)
}
