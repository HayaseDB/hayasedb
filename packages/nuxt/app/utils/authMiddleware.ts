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

    const { data: session } = await useAppSession()

    if (!session.value?.session) {
      return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
    }

    if (
      opts.requireAdmin &&
      (session.value.user.role !== 'admin' || session.value.user.banned)
    ) {
      const denied = createError({
        statusCode: 403,
        statusMessage: 'Access denied',
      })
      if (import.meta.client) showError(denied)
      return abortNavigation(denied)
    }
  })
}
