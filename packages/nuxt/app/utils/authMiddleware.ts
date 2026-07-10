export interface AuthMiddlewareOptions {
  requireAdmin?: boolean
  protectedPaths?: string[]
}

export function createAuthMiddleware(opts: AuthMiddlewareOptions = {}) {
  const protectedPaths = opts.protectedPaths ?? ['/settings']

  const authPaths = ['/login', '/register']

  return defineNuxtRouteMiddleware(async (to) => {
    if (authPaths.includes(to.path) || to.path.startsWith('/auth/')) return

    const isProtected =
      opts.requireAdmin ||
      protectedPaths.some(
        (path) => to.path === path || to.path.startsWith(`${path}/`),
      )

    if (!isProtected) return

    const { data } = await useAuth().getSession()

    if (!data?.session) {
      return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
    }

    if (opts.requireAdmin && (data.user.role !== 'admin' || data.user.banned)) {
      return navigateTo('/login')
    }
  })
}
