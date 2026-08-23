import { beforeEach, describe, expect, it, vi } from 'vitest'
import { safeRedirectPath } from './safeRedirectPath'

const navigateTo = vi.fn((target: unknown) => ({ navigated: target }))
vi.stubGlobal('navigateTo', navigateTo)
vi.stubGlobal('safeRedirectPath', safeRedirectPath)

let session: Record<string, unknown> | null = null
vi.stubGlobal('useAppSession', async () => ({ data: { value: session } }))

const { createAuthMiddleware } = await import('./authMiddleware')

type Middleware = (to: {
  path: string
  fullPath: string
  query: Record<string, unknown>
}) => Promise<unknown>

const route = (path: string, query: Record<string, unknown> = {}) => ({
  path,
  fullPath: Object.keys(query).length
    ? `${path}?${new URLSearchParams(query as Record<string, string>)}`
    : path,
  query,
})

const member = { session: { id: 's' }, user: { role: 'user', banned: false } }
const admin = { session: { id: 's' }, user: { role: 'admin', banned: false } }
const bannedAdmin = {
  session: { id: 's' },
  user: { role: 'admin', banned: true },
}

describe('createAuthMiddleware', () => {
  beforeEach(() => {
    navigateTo.mockClear()
    session = null
  })

  describe('web profile', () => {
    const run = createAuthMiddleware() as unknown as Middleware

    it('lets anonymous users through public and /auth/* routes', async () => {
      expect(await run(route('/anime/x'))).toBeUndefined()
      expect(await run(route('/auth/verify-email'))).toBeUndefined()
      expect(await run(route('/settingsx'))).toBeUndefined()
    })

    it('redirects anonymous users away from protected paths with the full path preserved', async () => {
      const result = await run(route('/settings/api-keys', { tab: 'keys' }))
      expect(result).toEqual({
        navigated: {
          path: '/login',
          query: { redirect: '/settings/api-keys?tab=keys' },
        },
      })
    })

    it('lets members into protected paths and bounces them off guest pages', async () => {
      session = member
      expect(await run(route('/settings'))).toBeUndefined()
      expect(await run(route('/login', { redirect: '/settings' }))).toEqual({
        navigated: '/settings',
      })
      expect(navigateTo).toHaveBeenLastCalledWith('/settings', {
        replace: true,
      })
      expect(await run(route('/register', { redirect: '//evil.com' }))).toEqual(
        {
          navigated: '/',
        },
      )
    })

    it('keeps anonymous users on guest pages', async () => {
      expect(await run(route('/login'))).toBeUndefined()
      expect(navigateTo).not.toHaveBeenCalled()
    })
  })

  describe('admin profile', () => {
    const run = createAuthMiddleware({
      requireAdmin: true,
    }) as unknown as Middleware

    it('protects every route except /auth/* and guest pages', async () => {
      expect(await run(route('/'))).toEqual({
        navigated: { path: '/login', query: { redirect: '/' } },
      })
      expect(await run(route('/auth/reset-password'))).toBeUndefined()
    })

    it('aborts with 403 for members and banned admins, allows admins', async () => {
      session = member
      const denied = (await run(route('/users'))) as { aborted: Error }
      expect(denied.aborted).toMatchObject({ statusCode: 403 })

      session = bannedAdmin
      const banned = (await run(route('/users'))) as { aborted: Error }
      expect(banned.aborted).toMatchObject({ statusCode: 403 })

      session = admin
      expect(await run(route('/users'))).toBeUndefined()
    })

    it('only redirects real admins off the login page', async () => {
      session = member
      expect(await run(route('/login'))).toBeUndefined()
      session = admin
      expect(await run(route('/login'))).toEqual({ navigated: '/' })
    })
  })
})
