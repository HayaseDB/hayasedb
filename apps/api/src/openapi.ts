import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod'
import {
  API_KEY_HEADER,
  INTERNAL_TOKEN_HEADER,
  contract,
  isApiKeyAllowed,
} from '@hayasedb/contract'
import type { Auth } from './auth/auth'

const VERSION = (
  JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
    version: string
  }
).version

type OpenApiInfo = { title: string; version: string; description: string }
type OpenApiDocument = {
  info?: Partial<OpenApiInfo>
  servers?: { url: string }[]
}

export type OpenApiSource = {
  slug: string
  title: string
  content: OpenApiDocument
  default?: boolean
}

const info = (title: string, description: string): OpenApiInfo => ({
  title: `HayaseDB ${title}`,
  version: VERSION,
  description,
})

export async function buildOpenApiSources(
  authApi: Auth['api'],
  publicUrl: string,
  includeInternal: boolean,
): Promise<OpenApiSource[]> {
  const apiServers = [{ url: `${publicUrl}/api` }]

  const generator = new OpenAPIGenerator({
    converters: [new ZodToJsonSchemaConverter()],
  })

  const publicApi = (await generator.generate(contract, {
    base: {
      info: info(
        'Public API',
        `Read-only anime data for third-party applications. Every request requires an API key sent in the ${API_KEY_HEADER} header: requests without one are rejected with 401. Create a key from your account settings. Keys are limited to 60 requests per minute.`,
      ),
      servers: apiServers,
      components: {
        securitySchemes: {
          apiKey: { type: 'apiKey', in: 'header', name: API_KEY_HEADER },
        },
      },
      security: [{ apiKey: [] }],
    },
    filter: (procedure) => isApiKeyAllowed(procedure),
  })) as unknown as OpenApiDocument

  const sources: OpenApiSource[] = [
    { slug: 'public', title: 'Public API', content: publicApi, default: true },
  ]

  if (!includeInternal) return sources

  const [internalApi, auth] = (await Promise.all([
    generator.generate(contract, {
      base: {
        info: info(
          'Internal API',
          `The complete HayaseDB contract, including session-authenticated and admin-only endpoints. Consumed by the HayaseDB web and admin clients, which relay requests with the ${INTERNAL_TOKEN_HEADER} header. That header exempts a request from the API key requirement but not from rate limiting (internal traffic is metered per client IP), and confers no identity: session cookies still determine what the caller may do.`,
        ),
        servers: apiServers,
        components: {
          securitySchemes: {
            internalToken: {
              type: 'apiKey',
              in: 'header',
              name: INTERNAL_TOKEN_HEADER,
            },
          },
        },
        security: [{ internalToken: [] }],
      },
    }),
    authApi.generateOpenAPISchema(),
  ])) as unknown as [OpenApiDocument, OpenApiDocument]

  auth.info = info(
    'Authentication',
    'Session, account, and API-key management endpoints served by Better Auth.',
  )
  auth.servers = [{ url: `${publicUrl}/api/auth` }]

  sources.push(
    { slug: 'internal', title: 'Internal API', content: internalApi },
    { slug: 'auth', title: 'Authentication', content: auth },
  )
  return sources
}
