import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { OpenAPIDocument } from '@orpc/openapi'
import {
  INTERNAL_TOKEN_HEADER,
  buildOpenApiDocument,
  buildPublicOpenApiDocument,
} from '@hayasedb/contract'

const VERSION = (
  JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
    version: string
  }
).version

export type OpenApiSource = {
  slug: string
  title: string
  content: OpenAPIDocument
  default?: boolean
}

export async function buildOpenApiSources(
  publicUrl: string,
  includeInternal: boolean,
): Promise<OpenApiSource[]> {
  const serverUrl = `${publicUrl}/api`

  const publicApi = await buildPublicOpenApiDocument({
    serverUrl,
    version: VERSION,
  })

  const sources: OpenApiSource[] = [
    { slug: 'public', title: 'Public API', content: publicApi, default: true },
  ]

  if (!includeInternal) return sources

  const internalApi = await buildOpenApiDocument({
    title: 'HayaseDB Internal API',
    version: VERSION,
    description: `The complete HayaseDB contract, including session-authenticated and admin-only endpoints. Consumed by the HayaseDB web and admin clients, which relay requests with the ${INTERNAL_TOKEN_HEADER} header. That header exempts a request from the API key requirement but not from rate limiting (internal traffic is metered per client IP), and confers no identity: session cookies still determine what the caller may do.`,
    serverUrl,
    securityScheme: { name: 'internalToken', header: INTERNAL_TOKEN_HEADER },
  })

  sources.push({
    slug: 'internal',
    title: 'Internal API',
    content: internalApi,
  })
  return sources
}
