import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { settle } from '@hayasedb/nuxt/test/helpers'
import {
  clearNuxtData,
  invalidateAppSessionCache,
  useAppSession,
  useRouter,
} from '#imports'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))

mockNuxtImport('useApiClient', () => () => ({ auth: { getSession } }))

const session = (id: string) => ({
  session: { id },
  user: { id: 'u1', role: 'user', banned: false },
})

const Consumer = defineComponent({
  async setup() {
    const { data } = await useAppSession()
    return () => h('span', data.value?.session.id ?? 'anon')
  },
})

beforeEach(async () => {
  await useRouter().push('/')
  invalidateAppSessionCache()
  clearNuxtData()
  getSession.mockReset()
  getSession.mockResolvedValue(session('s1'))
})

describe('session-sync plugin', () => {
  it('refetches the session when another tab announces a change', async () => {
    const w = await mountSuspended(Consumer)
    expect(w.text()).toBe('s1')
    const calls = getSession.mock.calls.length
    getSession.mockResolvedValue(session('s2'))
    new BroadcastChannel('hayasedb:session').postMessage('changed')
    await settle()
    expect(getSession.mock.calls.length).toBe(calls + 1)
    expect(w.text()).toBe('s2')
    w.unmount()
  })

  it('ignores unrelated messages on the channel', async () => {
    const w = await mountSuspended(Consumer)
    const calls = getSession.mock.calls.length
    new BroadcastChannel('hayasedb:session').postMessage('something-else')
    await settle()
    expect(getSession.mock.calls.length).toBe(calls)
    w.unmount()
  })

  it('refetches on window focus only while signed in', async () => {
    getSession.mockResolvedValue(null)
    const anon = await mountSuspended(Consumer)
    expect(anon.text()).toBe('anon')
    let calls = getSession.mock.calls.length
    window.dispatchEvent(new Event('focus'))
    await settle()
    expect(getSession.mock.calls.length).toBe(calls)
    anon.unmount()

    invalidateAppSessionCache()
    clearNuxtData()
    getSession.mockResolvedValue(session('s1'))
    const signedIn = await mountSuspended(Consumer)
    calls = getSession.mock.calls.length
    window.dispatchEvent(new Event('focus'))
    await settle()
    expect(getSession.mock.calls.length).toBe(calls + 1)
    signedIn.unmount()
  })

  it('re-runs the current route when the session id changes under the user', async () => {
    const w = await mountSuspended(Consumer, { route: '/explore?format=TV' })
    const router = useRouter()
    const replace = vi.spyOn(router, 'replace')
    getSession.mockResolvedValue(session('s2'))
    new BroadcastChannel('hayasedb:session').postMessage('changed')
    await settle()
    expect(replace).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/explore',
        query: { format: 'TV' },
        force: true,
      }),
    )
    w.unmount()
  })
})
