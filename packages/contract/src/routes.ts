import {
  DEFAULT_OPENAPI_METHOD,
  getDynamicPathParams,
  getOpenAPIMeta,
} from '@orpc/openapi'
import { contract } from './routers'
import type { BffAudience, CachePolicy } from './meta'
import { getBffAudiences, getCachePolicy, isApiKeyAllowed } from './meta'

type ContractNode = Parameters<typeof getOpenAPIMeta>[0] &
  Parameters<typeof isApiKeyAllowed>[0] &
  Parameters<typeof getCachePolicy>[0]

const isProcedure = (node: unknown): node is ContractNode =>
  typeof node === 'object' && node !== null && '~orpc' in node

export interface ContractRoute {
  method: string
  path: `/${string}`
  apiKey: boolean
  bff: readonly BffAudience[]
  cache?: CachePolicy
}

export function collectRoutes(
  node: unknown = contract,
  routes: ContractRoute[] = [],
): ContractRoute[] {
  if (isProcedure(node)) {
    const meta = getOpenAPIMeta(node)
    if (meta?.path) {
      routes.push({
        method: meta.method ?? DEFAULT_OPENAPI_METHOD,
        path: meta.path,
        apiKey: isApiKeyAllowed(node),
        bff: getBffAudiences(node),
        cache: getCachePolicy(node),
      })
    }
    return routes
  }
  if (typeof node === 'object' && node !== null) {
    for (const child of Object.values(node)) collectRoutes(child, routes)
  }
  return routes
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function toPathRegex(path: `/${string}`): RegExp {
  const params = getDynamicPathParams(path) ?? []
  let source = ''
  let cursor = 0
  for (const param of params) {
    source += escape(path.slice(cursor, param.startIndex))
    source += param.allowsSlash ? '.+' : '[^/]+'
    cursor = param.startIndex + param.segment.length
  }
  source += escape(path.slice(cursor))
  return new RegExp(`^${source}$`)
}

interface RouteMatcher {
  matches(method: string, pathname: string): boolean
}

function createRouteMatcher(routes: readonly ContractRoute[]): RouteMatcher {
  const compiled = routes.map((route) => ({
    method: route.method,
    regex: toPathRegex(route.path),
  }))

  return {
    matches(method, pathname) {
      const upper = method.toUpperCase()
      const verb = upper === 'HEAD' ? 'GET' : upper
      return compiled.some(
        (route) => route.method === verb && route.regex.test(pathname),
      )
    },
  }
}

export const createBffMatcher = (audience: BffAudience): RouteMatcher =>
  createRouteMatcher(collectRoutes().filter((r) => r.bff.includes(audience)))
