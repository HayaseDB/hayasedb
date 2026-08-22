import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { OpenAPIGenerator } from '@orpc/openapi'
import type { OpenAPIDocument } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod'
import {
  API_KEY_HEADER,
  INTERNAL_TOKEN_HEADER,
  contract,
  isApiKeyAllowed,
} from '@hayasedb/contract'

const VERSION = (
  JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
    version: string
  }
).version

type OpenApiInfo = { title: string; version: string; description: string }

export type OpenApiSource = {
  slug: string
  title: string
  content: OpenAPIDocument
  default?: boolean
}

const info = (title: string, description: string): OpenApiInfo => ({
  title: `HayaseDB ${title}`,
  version: VERSION,
  description,
})

const shouldHoistDef = (defName: string) => defName !== 'UndefinedError'

export async function buildOpenApiSources(
  publicUrl: string,
  includeInternal: boolean,
): Promise<OpenApiSource[]> {
  const apiServers = [{ url: `${publicUrl}/api` }]

  const generator = new OpenAPIGenerator({
    converters: [new ZodToJsonSchemaConverter()],
  })

  const publicApi = await generator.generate(contract, {
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
    shouldHoistDef,
  })

  const sources: OpenApiSource[] = [
    { slug: 'public', title: 'Public API', content: publicApi, default: true },
  ]

  if (!includeInternal) return sources

  const internalApi = await generator.generate(contract, {
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
    shouldHoistDef,
  })

  sources.push({
    slug: 'internal',
    title: 'Internal API',
    content: internalApi,
  })
  return sources
}
