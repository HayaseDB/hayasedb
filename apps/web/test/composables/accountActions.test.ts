import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearNuxtData,
  invalidateAppSessionCache,
  useAccountActions,
  useAppSession,
} from '#imports'

const { api, toast } = vi.hoisted(() => ({
  api: {
    auth: {
      getSession: vi.fn(),
      sendVerificationEmail: vi.fn(),
      signOut: vi.fn(),
      deleteUser: vi.fn(),
      changePassword: vi.fn(),
      updateUser: vi.fn(),
    },
    account: {
      uploadAvatar: vi.fn(),
    },
  },
  toast: { add: vi.fn() },
}))

mockNuxtImport('useApiClient', () => () => api)
mockNuxtImport('useToast', () => () => toast)

let actions: ReturnType<typeof useAccountActions>
let sessionId: () => string
let sessionImage: () => string | null

const Consumer = defineComponent({
  async setup() {
    const { data } = await useAppSession()
    sessionId = () => data.value?.session.id ?? 'anon'
    sessionImage = () => data.value?.user.image ?? null
    actions = useAccountActions()
    return () => h('span')
  },
})

beforeEach(() => {
  toast.add.mockReset()
  invalidateAppSessionCache()
  clearNuxtData()
  for (const group of Object.values(api)) {
    for (const fn of Object.values(group)) fn.mockReset()
  }
  api.auth.getSession.mockResolvedValue({
    session: { id: 's1' },
    user: { id: 'u1', role: 'user', banned: false },
  })
})

describe('useAccountActions', () => {
  it('treats an already verified address as success', async () => {
    const w = await mountSuspended(Consumer)
    api.auth.sendVerificationEmail.mockRejectedValue(
      Object.assign(new Error('Already verified'), { code: 'CONFLICT' }),
    )
    await expect(actions.resendVerification('a@b.c')).resolves.toBe(true)
    expect(toast.add).toHaveBeenCalledTimes(1)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Already verified', color: 'success' }),
    )
    expect(api.auth.sendVerificationEmail).toHaveBeenCalledWith({
      email: 'a@b.c',
      callbackURL: `${window.location.origin}/`,
    })
    w.unmount()
  })

  it('reports other failures with the server message and returns false', async () => {
    const w = await mountSuspended(Consumer)
    api.auth.sendVerificationEmail.mockRejectedValue(
      Object.assign(new Error('Too many requests'), {
        code: 'TOO_MANY_REQUESTS',
      }),
    )
    await expect(actions.resendVerification('a@b.c')).resolves.toBe(false)
    expect(toast.add).toHaveBeenCalledWith({
      title: 'Could not send email',
      description: 'Too many requests',
      color: 'error',
    })
    w.unmount()
  })

  it('signOut and deleteAccount refresh the app session so the ui drops the user', async () => {
    const w = await mountSuspended(Consumer)
    expect(sessionId()).toBe('s1')
    api.auth.signOut.mockImplementation(async () => {
      api.auth.getSession.mockResolvedValue(null)
      return { success: true }
    })
    await actions.signOut()
    expect(sessionId()).toBe('anon')

    api.auth.deleteUser.mockRejectedValue(new Error('nope'))
    await expect(actions.deleteAccount()).resolves.toBe(false)
    expect(toast.add).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: 'Could not delete account' }),
    )
    w.unmount()
  })

  it('uploadAvatar refreshes the app session so the new image renders without a reload', async () => {
    const w = await mountSuspended(Consumer)
    expect(sessionImage()).toBeNull()
    api.account.uploadAvatar.mockImplementation(async () => {
      api.auth.getSession.mockResolvedValue({
        session: { id: 's1' },
        user: {
          id: 'u1',
          role: 'user',
          banned: false,
          image: 'https://cdn.test/media/abc/original.webp',
        },
      })
      return { image: 'https://cdn.test/media/abc/original.webp' }
    })
    await expect(actions.uploadAvatar(new File([''], 'a.png'))).resolves.toBe(
      true,
    )
    expect(api.auth.getSession).toHaveBeenCalledTimes(2)
    expect(sessionImage()).toBe('https://cdn.test/media/abc/original.webp')
    w.unmount()
  })

  it('does not refresh the app session when the upload fails', async () => {
    const w = await mountSuspended(Consumer)
    api.account.uploadAvatar.mockRejectedValue(new Error('too large'))
    await expect(actions.uploadAvatar(new File([''], 'a.png'))).resolves.toBe(
      false,
    )
    expect(api.auth.getSession).toHaveBeenCalledTimes(1)
    expect(toast.add).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: 'Upload failed' }),
    )
    w.unmount()
  })

  it('updateProfile refreshes the app session', async () => {
    const w = await mountSuspended(Consumer)
    api.auth.updateUser.mockResolvedValue({ status: true })
    await expect(actions.updateProfile({ name: 'Nadeshiko' })).resolves.toBe(
      true,
    )
    expect(api.auth.updateUser).toHaveBeenCalledWith({ name: 'Nadeshiko' })
    expect(api.auth.getSession).toHaveBeenCalledTimes(2)
    w.unmount()
  })

  it('changePassword always revokes other sessions', async () => {
    const w = await mountSuspended(Consumer)
    api.auth.changePassword.mockResolvedValue({ status: true })
    await expect(
      actions.changePassword({
        currentPassword: 'old-password',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      }),
    ).resolves.toBe(true)
    expect(api.auth.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old-password',
      newPassword: 'new-password',
      revokeOtherSessions: true,
    })
    expect(actions.loading.value).toBe(false)
    w.unmount()
  })
})
