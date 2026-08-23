import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from '../../test/setup'

const refreshAppSession = vi.fn()
vi.mock('../composables/useSessionSync', () => ({
  refreshAppSession: (...args: unknown[]) => refreshAppSession(...args),
}))

const session: { value: unknown } = { value: null }
vi.stubGlobal('useNuxtData', () => ({ data: session }))

const { handleUnauthenticated } = await import('./sessionInvalidation')

describe('handleUnauthenticated', () => {
  beforeEach(() => {
    refreshAppSession.mockReset()
  })

  it('does nothing when there is no cached session', async () => {
    session.value = null
    await handleUnauthenticated()
    expect(refreshAppSession).not.toHaveBeenCalled()
  })

  it('refreshes once for concurrent callers and toasts only if the session is really gone', async () => {
    session.value = { user: { id: 'u1' } }
    let release!: () => void
    refreshAppSession.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = () => {
            session.value = null
            resolve()
          }
        }),
    )

    const first = handleUnauthenticated()
    const second = handleUnauthenticated()
    expect(first).toBe(second)
    expect(refreshAppSession).toHaveBeenCalledTimes(1)

    release()
    await first
    expect(toast.add).toHaveBeenCalledTimes(1)
    expect(toast.add.mock.calls[0]?.[0]).toMatchObject({
      title: 'Session expired',
    })

    session.value = { user: { id: 'u1' } }
    refreshAppSession.mockResolvedValue(undefined)
    await handleUnauthenticated()
    expect(refreshAppSession).toHaveBeenCalledTimes(2)
    expect(toast.add).toHaveBeenCalledTimes(1)
  })
})
