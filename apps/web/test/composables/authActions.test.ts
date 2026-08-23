import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearNuxtData,
  invalidateAppSessionCache,
  useAuthActions,
  useRouter,
} from '#imports'

const { api, toast } = vi.hoisted(() => ({
  api: {
    auth: {
      getSession: vi.fn(),
      signInEmail: vi.fn(),
      signUpEmail: vi.fn(),
      signInSocial: vi.fn(),
      signOut: vi.fn(),
      verifyEmail: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    },
  },
  toast: { add: vi.fn() },
}))

mockNuxtImport('useApiClient', () => () => api)
mockNuxtImport('useToast', () => () => toast)

const user = (role: 'user' | 'admin', banned = false) => ({
  session: { id: 's1' },
  user: { id: 'u1', role, banned },
})

let actions: ReturnType<typeof useAuthActions>

const Consumer = defineComponent({
  setup() {
    actions = useAuthActions()
    return () => h('span')
  },
})

const mountAt = (route: string) => mountSuspended(Consumer, { route })
const currentPath = () => useRouter().currentRoute.value.fullPath
const apiError = (code: string, message: string) =>
  Object.assign(new Error(message), { code })

beforeEach(async () => {
  toast.add.mockReset()
  for (const fn of Object.values(api.auth)) fn.mockReset()
  api.auth.getSession.mockResolvedValue(null)
  await useRouter().push('/')
  invalidateAppSessionCache()
  clearNuxtData()
  for (const fn of Object.values(api.auth)) fn.mockReset()
  api.auth.getSession.mockResolvedValue(null)
  api.auth.signOut.mockResolvedValue({ success: true })
})

function signInAs(role: 'user' | 'admin', banned = false) {
  api.auth.signInEmail.mockImplementation(async () => {
    api.auth.getSession.mockResolvedValue(user(role, banned))
    return { token: 't' }
  })
}

describe('useAuthActions.signInEmail', () => {
  it('refreshes the session and follows a safe redirect target', async () => {
    const w = await mountAt('/login?redirect=%2Fsettings%3Ftab%3Dkeys')
    signInAs('user')
    const before = api.auth.getSession.mock.calls.length
    await expect(
      actions.signInEmail({ email: 'a@b.c', password: 'x' }),
    ).resolves.toBe(true)
    expect(api.auth.getSession.mock.calls.length).toBeGreaterThan(before)
    expect(currentPath()).toBe('/settings?tab=keys')
    expect(actions.loading.value).toBe(false)
    w.unmount()
  })

  it('falls back to the home page for a protocol-relative redirect', async () => {
    const w = await mountAt('/login?redirect=%2F%2Fevil.com')
    signInAs('user')
    await actions.signInEmail({ email: 'a@b.c', password: 'x' })
    expect(currentPath()).toBe('/')
    w.unmount()
  })

  it('surfaces the server message in a toast and stays on the page on failure', async () => {
    const w = await mountAt('/login')
    api.auth.signInEmail.mockRejectedValue(
      apiError('UNAUTHORIZED', 'Invalid email or password'),
    )
    const push = vi.spyOn(useRouter(), 'push')
    await expect(
      actions.signInEmail({ email: 'a@b.c', password: 'x' }),
    ).resolves.toBe(false)
    expect(toast.add).toHaveBeenCalledWith({
      title: 'Sign in failed',
      description: 'Invalid email or password',
      color: 'error',
    })
    expect(push).not.toHaveBeenCalled()
    expect(currentPath()).toBe('/login')
    expect(actions.loading.value).toBe(false)
    w.unmount()
  })

  it('requireAdmin signs a non-admin straight back out', async () => {
    const w = await mountAt('/login?redirect=%2Fsettings')
    signInAs('user')
    api.auth.signOut.mockImplementation(async () => {
      api.auth.getSession.mockResolvedValue(null)
      return { success: true }
    })
    await expect(
      actions.signInEmail(
        { email: 'a@b.c', password: 'x' },
        { requireAdmin: true },
      ),
    ).resolves.toBe(false)
    expect(api.auth.signOut).toHaveBeenCalledTimes(1)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Access denied', color: 'error' }),
    )
    expect(currentPath()).toBe('/login?redirect=/settings')
    w.unmount()
  })

  it('requireAdmin rejects a banned admin and accepts an active one', async () => {
    const w = await mountAt('/login?redirect=%2Fsettings')
    api.auth.signOut.mockImplementation(async () => {
      api.auth.getSession.mockResolvedValue(null)
      return { success: true }
    })
    signInAs('admin', true)
    await expect(
      actions.signInEmail(
        { email: 'a@b.c', password: 'x' },
        { requireAdmin: true },
      ),
    ).resolves.toBe(false)
    expect(currentPath()).toBe('/login?redirect=/settings')

    signInAs('admin')
    await expect(
      actions.signInEmail(
        { email: 'a@b.c', password: 'x' },
        { requireAdmin: true },
      ),
    ).resolves.toBe(true)
    expect(currentPath()).toBe('/settings')
    w.unmount()
  })
})

describe('useAuthActions.signInSocial', () => {
  it('builds provider callbacks from the origin and the redirect target', async () => {
    const w = await mountAt('/login?redirect=%2Fexplore')
    api.auth.signInSocial.mockResolvedValue({ url: null })
    await actions.signInSocial('github')
    expect(api.auth.signInSocial).toHaveBeenCalledWith({
      provider: 'github',
      callbackURL: `${window.location.origin}/explore`,
      errorCallbackURL: `${window.location.origin}/login`,
    })
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Sign in failed' }),
    )
    expect(actions.loading.value).toBe(false)
    w.unmount()
  })
})

describe('useAuthActions password flows', () => {
  it('resetPassword navigates to login on success and maps a bad token to the fallback text', async () => {
    const w = await mountAt('/auth/reset-password')
    api.auth.resetPassword.mockRejectedValue(apiError('BAD_REQUEST', ''))
    await expect(actions.resetPassword('bad', 'newpassword1')).resolves.toBe(
      false,
    )
    expect(toast.add).toHaveBeenLastCalledWith({
      title: 'Reset failed',
      description: 'This link is invalid or has expired.',
      color: 'error',
    })
    expect(currentPath()).toBe('/auth/reset-password')

    api.auth.resetPassword.mockResolvedValue({ status: true })
    await expect(actions.resetPassword('good', 'newpassword1')).resolves.toBe(
      true,
    )
    expect(currentPath()).toBe('/login')
    w.unmount()
  })

  it('requestPasswordReset reports success regardless of whether the email exists', async () => {
    const w = await mountAt('/login')
    api.auth.requestPasswordReset.mockResolvedValue({ status: true })
    await expect(
      actions.requestPasswordReset('nobody@example.com'),
    ).resolves.toBe(true)
    expect(api.auth.requestPasswordReset).toHaveBeenCalledWith({
      email: 'nobody@example.com',
      redirectTo: '/auth/reset-password',
    })
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Check your inbox', color: 'success' }),
    )
    w.unmount()
  })

  it('verifyEmail refreshes the session only after a successful verification', async () => {
    const w = await mountAt('/auth/verify-email?token=t1')
    api.auth.verifyEmail.mockRejectedValue(apiError('BAD_REQUEST', ''))
    await expect(actions.verifyEmail('x')).resolves.toBe(false)
    const before = api.auth.getSession.mock.calls.length
    api.auth.verifyEmail.mockResolvedValue({ status: true })
    await expect(actions.verifyEmail('x')).resolves.toBe(true)
    expect(api.auth.getSession.mock.calls.length).toBe(before + 1)
    w.unmount()
  })
})
