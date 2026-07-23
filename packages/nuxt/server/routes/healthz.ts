import { isDraining } from '../utils/shutdown-state'

export default defineEventHandler((event) => {
  if (isDraining()) {
    setResponseStatus(event, 503)
    return { status: 'draining' }
  }
  return { status: 'ok' }
})
