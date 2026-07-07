export interface AuthMiddlewareOptions {
  requireAdmin?: boolean
  publicPaths?: string[]
}

export function createAuthMiddleware(opts: AuthMiddlewareOptions = {}) {
  const publicPaths = opts.publicPaths ?? ['/login', '/register']

  return defineNuxtRouteMiddleware(async (to) => {
    if (publicPaths.includes(to.path)) return

    const { data } = await useAuth().getSession()

    if (!data?.session) {
      return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
    }

    if (opts.requireAdmin && (data.user.role !== 'admin' || data.user.banned)) {
      return navigateTo('/login')
    }
  })
}
