import { createHash, timingSafeEqual } from 'node:crypto'
import {
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  applyDecorators,
} from '@nestjs/common'
import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { SkipThrottle } from '@nestjs/throttler'
import { getDynamicPathParams } from '@orpc/openapi'
import {
  API_KEY_HEADER,
  INTERNAL_TOKEN_HEADER,
  collectRoutes,
} from '@hayasedb/contract'
import type { Request } from 'express'
import type { Env } from '../config/env.schema'

export const OPEN_ENDPOINT = 'OPEN_ENDPOINT'

export const OpenEndpoint = () =>
  applyDecorators(SkipThrottle(), SetMetadata(OPEN_ENDPOINT, true))

export function getApiKey(request: Request): string | undefined {
  const header = request.headers[API_KEY_HEADER]
  const apiKey = Array.isArray(header) ? header[0] : header
  return apiKey || undefined
}

export const hasApiKey = (request: Request) => getApiKey(request) !== undefined

const digest = (value: string) => createHash('sha256').update(value).digest()

function isInternalRequest(
  request: Request,
  tokenDigests: readonly Buffer[],
): boolean {
  if (tokenDigests.length === 0) return true

  const header = request.headers[INTERNAL_TOKEN_HEADER]
  const candidate = Array.isArray(header) ? header[0] : header
  if (!candidate) return false

  const candidateDigest = digest(candidate)
  let matched = false
  for (const tokenDigest of tokenDigests) {
    if (timingSafeEqual(candidateDigest, tokenDigest)) matched = true
  }
  return matched
}

function toNestPath(path: string): string {
  const params = getDynamicPathParams(path as `/${string}`)
  if (!params?.length) return path

  let result = path
  for (let i = params.length - 1; i >= 0; i--) {
    const param = params[i]!
    const pattern = param.allowsSlash ? '*' : `:${param.parameterName}`
    result =
      result.slice(0, param.startIndex) +
      pattern +
      result.slice(param.startIndex + param.segment.length)
  }
  return result
}

const collectAllowedRoutes = () =>
  new Set(
    collectRoutes()
      .filter((route) => route.apiKey)
      .map((route) => `${route.method} /api${toNestPath(route.path)}`),
  )

@Injectable()
export class ApiAccessGuard implements CanActivate {
  private readonly tokenDigests: readonly Buffer[]
  private readonly allowedRoutes = collectAllowedRoutes()

  constructor(
    config: ConfigService<Env, true>,
    private readonly reflector: Reflector,
  ) {
    this.tokenDigests = config
      .get('INTERNAL_API_TOKEN', { infer: true })
      .map(digest)
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    request.internal = isInternalRequest(request, this.tokenDigests)
    request.apiKeyAuth = hasApiKey(request)

    const open = this.reflector.getAllAndOverride<boolean>(OPEN_ENDPOINT, [
      context.getHandler(),
      context.getClass(),
    ])
    if (open) return true
    if (request.internal) return true

    if (!request.apiKeyAuth) {
      throw new UnauthorizedException({
        message: 'An API key is required to access this endpoint.',
        code: 'MISSING_API_KEY',
      })
    }

    const method = request.method === 'HEAD' ? 'GET' : request.method
    const routePath = request.route?.path

    if (
      typeof routePath === 'string' &&
      this.allowedRoutes.has(`${method} ${routePath}`)
    ) {
      return true
    }

    throw new ForbiddenException('API keys are not allowed on this endpoint')
  }
}
