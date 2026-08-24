import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod'
import { expect, it } from 'vitest'
import { buildPublicOpenApiDocument, collectRoutes, contract } from '../src'

it('keeps the public surface of the OpenAPI document stable', async () => {
  const generator = new OpenAPIGenerator({
    converters: [new ZodToJsonSchemaConverter()],
  })
  const document = await generator.generate(contract, {
    info: { title: 'HayaseDB', version: '0.0.0' },
  })
  const surface = Object.entries(document.paths ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([path, item]) =>
      Object.entries(item ?? {}).map(([method, operation]) => {
        const op = operation as {
          operationId?: string
          tags?: string[]
          parameters?: { name: string; in: string; required?: boolean }[]
          requestBody?: { content?: Record<string, unknown> }
          responses?: Record<string, unknown>
        }
        return {
          route: `${method.toUpperCase()} ${path}`,
          operationId: op.operationId,
          tags: op.tags,
          parameters: op.parameters?.map(
            (p) => `${p.in}:${p.name}${p.required ? '' : '?'}`,
          ),
          requestBody: op.requestBody
            ? Object.keys(op.requestBody.content ?? {})
            : undefined,
          responses: Object.keys(op.responses ?? {}),
        }
      }),
    )
  await expect(JSON.stringify(surface, null, 2) + '\n').toMatchFileSnapshot(
    './__snapshots__/openapi-surface.json',
  )
})

it('publishes exactly the api-key routes and nothing else', async () => {
  const document = await buildPublicOpenApiDocument({
    serverUrl: 'https://example.invalid/api',
    version: '0.0.0',
  })

  const published = Object.entries(document.paths ?? {})
    .flatMap(([path, item]) =>
      Object.keys(item ?? {}).map(
        (method) => `${method.toUpperCase()} ${path}`,
      ),
    )
    .sort()

  const expected = collectRoutes()
    .filter((route) => route.apiKey)
    .map((route) => `${route.method} ${route.path}`)
    .sort()

  expect(published).toEqual(expected)
})

it('never exposes session-only surfaces in the public document', async () => {
  const document = await buildPublicOpenApiDocument({
    serverUrl: 'https://example.invalid/api',
    version: '0.0.0',
  })

  const paths = Object.keys(document.paths ?? {})

  expect(paths.length).toBeGreaterThan(0)
  for (const prefix of [
    '/auth',
    '/account',
    '/changeset',
    '/revision',
    '/media',
  ]) {
    expect(paths.filter((path) => path.startsWith(prefix))).toEqual([])
  }
})
