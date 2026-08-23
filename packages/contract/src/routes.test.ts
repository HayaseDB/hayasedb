import { describe, expect, it } from 'vitest'
import { collectRoutes, createBffMatcher } from './routes'
import { contract } from './routers'

const routes = collectRoutes()

describe('collectRoutes', () => {
  it('collects every procedure exactly once with method and path', () => {
    const keys = routes.map((r) => `${r.method} ${r.path}`)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toContain('GET /anime')
    expect(keys).toContain('POST /anime')
    expect(keys).toContain('GET /anime/by-slug/{slug}')
    expect(keys).toContain('GET /auth/callback/{id}')
  })

  it('only exposes read-only anime and system routes to API keys', () => {
    const apiKeyRoutes = routes.filter((r) => r.apiKey)
    expect(apiKeyRoutes.every((r) => r.method === 'GET')).toBe(true)
    expect(apiKeyRoutes.map((r) => r.path).sort()).toEqual([
      '/anime',
      '/anime/by-slug/{slug}',
      '/genres',
      '/ping',
      '/stats',
      '/version',
    ])
  })

  it('never exposes admin routes to the web audience', () => {
    const adminPaths = routes.filter((r) => r.path.startsWith('/auth/admin'))
    expect(adminPaths.length).toBeGreaterThan(0)
    expect(adminPaths.every((r) => !r.bff.includes('web'))).toBe(true)
    expect(adminPaths.every((r) => r.bff.includes('admin'))).toBe(true)
  })

  it('walks nested routers', () => {
    expect(collectRoutes(contract.anime).length).toBeGreaterThan(5)
    expect(collectRoutes({})).toEqual([])
  })
})

describe('createBffMatcher', () => {
  const web = createBffMatcher('web')
  const admin = createBffMatcher('admin')

  it.each([
    ['GET', '/anime', true],
    ['HEAD', '/anime', true],
    ['head', '/anime', true],
    ['get', '/anime', true],
    ['GET', '/anime/by-slug/some-slug', true],
    ['GET', '/anime/by-slug/a/b', false],
    ['GET', '/anime/by-slug/', false],
    ['GET', '/animex', false],
    ['GET', '/anime.', false],
    ['DELETE', '/anime', false],
    ['GET', '/auth/admin/users', false],
    ['POST', '/auth/sign-in/email', true],
    ['GET', '/ping', false],
    ['GET', '/version', false],
    ['GET', '/docs', false],
    ['GET', '', false],
  ])('web %s %s => %s', (method, path, allowed) => {
    expect(web.matches(method, path)).toBe(allowed)
  })

  it('lets admin reach admin routes and param routes', () => {
    expect(admin.matches('GET', '/auth/admin/users')).toBe(true)
    expect(admin.matches('GET', '/auth/admin/users/abc')).toBe(true)
    expect(admin.matches('GET', '/auth/admin/users/abc/extra')).toBe(false)
    expect(admin.matches('POST', '/auth/admin/users/abc/ban')).toBe(true)
  })

  it('does not treat a regex metacharacter in the path as a wildcard', () => {
    expect(web.matches('GET', '/anime/by-slug/x')).toBe(true)
    expect(web.matches('GET', '/animeXby-slug/x')).toBe(false)
  })
})
