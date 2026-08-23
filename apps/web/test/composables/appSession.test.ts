import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearNuxtData,
  invalidateAppSessionCache,
  refreshAppSession,
  useAppSession,
  useNuxtApp,
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

async function mountConsumer() {
  const wrapper = await mountSuspended(Consumer)
  return { text: () => wrapper.text(), unmount: () => wrapper.unmount() }
}

beforeEach(() => {
  vi.useFakeTimers()
  invalidateAppSessionCache()
  clearNuxtData('app-session')
  getSession.mockReset()
  getSession.mockImplementation(async () => session('s1'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useAppSession', () => {
  it('always bypasses the auth cookie cache', async () => {
    const c = await mountConsumer()
    expect(getSession).toHaveBeenCalledWith({ disableCookieCache: true })
    expect(c.text()).toBe('s1')
    c.unmount()
  })

  it('a remount inside the 30 second window reuses the cached session', async () => {
    const first = await mountConsumer()
    first.unmount()
    vi.advanceTimersByTime(29_000)
    const second = await mountConsumer()
    expect(second.text()).toBe('s1')
    expect(getSession).toHaveBeenCalledTimes(1)
    second.unmount()
  })

  it('a remount after the window refetches', async () => {
    const first = await mountConsumer()
    first.unmount()
    vi.advanceTimersByTime(31_000)
    getSession.mockImplementation(async () => session('s2'))
    const second = await mountConsumer()
    expect(getSession).toHaveBeenCalledTimes(2)
    expect(second.text()).toBe('s2')
    second.unmount()
  })

  it('a remount after invalidateAppSessionCache refetches even inside the window', async () => {
    const first = await mountConsumer()
    first.unmount()
    invalidateAppSessionCache()
    const second = await mountConsumer()
    expect(getSession).toHaveBeenCalledTimes(2)
    second.unmount()
  })

  it('resolves a failed session lookup to anonymous instead of an error', async () => {
    getSession.mockRejectedValue(new Error('boom'))
    const c = await mountConsumer()
    expect(c.text()).toBe('anon')
    expect(useNuxtApp().payload._errors['app-session']).toBeFalsy()
    c.unmount()
  })

  it('refreshAppSession forces a new request within the window', async () => {
    const c = await mountConsumer()
    getSession.mockImplementation(async () => session('s2'))
    await refreshAppSession({ broadcast: false })
    expect(getSession).toHaveBeenCalledTimes(2)
    expect(c.text()).toBe('s2')
    c.unmount()
  })

  it('a second consumer mounted while the first is resolving reuses the stored result', async () => {
    const first = await mountConsumer()
    const second = await mountConsumer()
    expect(first.text()).toBe('s1')
    expect(second.text()).toBe('s1')
    expect(getSession).toHaveBeenCalledTimes(1)
    first.unmount()
    second.unmount()
  })
})
