import { OpenAPIGenerator } from '@orpc/openapi'
import type { OpenAPIDocument } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod'
import { API_KEY_HEADER, isApiKeyAllowed } from './meta'
import { contract } from './routers'

export const PUBLIC_API_DESCRIPTION = [
  'Read-only anime data for third-party applications.',
  `Every request requires an API key sent in the ${API_KEY_HEADER} header; requests without one are rejected with 401. Create a key from your account settings.`,
  'Each key carries its own rate limit, reported on every response through the `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` headers. New keys default to 60 requests per minute.',
  'Responses are cacheable: read endpoints send `Cache-Control` and an `ETag`, so replaying the tag as `If-None-Match` yields a `304 Not Modified`.',
  'Resources are addressed by their identifier — `GET /anime/{id}`, `GET /genres/{id}`. To look one up by an alternate key, filter the collection instead: `GET /anime?slug=…` or `GET /genres?name=…`.',
].join('\n\n')

const shouldHoistDef = (defName: string) => defName !== 'UndefinedError'

const generator = new OpenAPIGenerator({
  converters: [new ZodToJsonSchemaConverter()],
})

export interface OpenApiDocumentOptions {
  title: string
  version: string
  description: string
  serverUrl: string
  securityScheme: { name: string; header: string }
  filter?: (procedure: Parameters<typeof isApiKeyAllowed>[0]) => boolean
}

export function buildOpenApiDocument({
  title,
  version,
  description,
  serverUrl,
  securityScheme,
  filter,
}: OpenApiDocumentOptions): Promise<OpenAPIDocument> {
  return generator.generate(contract, {
    base: {
      info: { title, version, description },
      servers: [{ url: serverUrl }],
      components: {
        securitySchemes: {
          [securityScheme.name]: {
            type: 'apiKey',
            in: 'header',
            name: securityScheme.header,
          },
        },
      },
      security: [{ [securityScheme.name]: [] }],
    },
    filter,
    shouldHoistDef,
  })
}

export interface PublicOpenApiOptions {
  serverUrl: string
  version: string
}

export function buildPublicOpenApiDocument({
  serverUrl,
  version,
}: PublicOpenApiOptions): Promise<OpenAPIDocument> {
  return buildOpenApiDocument({
    title: 'HayaseDB Public API',
    version,
    description: PUBLIC_API_DESCRIPTION,
    serverUrl,
    securityScheme: { name: 'apiKey', header: API_KEY_HEADER },
    filter: (procedure) => isApiKeyAllowed(procedure),
  })
}
