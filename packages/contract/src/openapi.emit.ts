import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from '../package.json' with { type: 'json' }
import { buildPublicOpenApiDocument } from './openapi'
import { collectRoutes } from './routes'

const SERVER_URL_PLACEHOLDER = 'https://api.hayasedb.invalid/api'

const document = await buildPublicOpenApiDocument({
  serverUrl: SERVER_URL_PLACEHOLDER,
  version: pkg.version,
})

const published = Object.entries(document.paths ?? {})
  .flatMap(([path, item]) =>
    Object.keys(item ?? {}).map((method) => `${method.toUpperCase()} ${path}`),
  )
  .sort()

const expected = collectRoutes()
  .filter((route) => route.apiKey)
  .map((route) => `${route.method} ${route.path}`)
  .sort()

const missing = expected.filter((route) => !published.includes(route))
const unexpected = published.filter((route) => !expected.includes(route))

if (missing.length > 0 || unexpected.length > 0) {
  throw new Error(
    [
      'Public OpenAPI document does not match the contract api-key routes.',
      missing.length > 0 && `missing: ${missing.join(', ')}`,
      unexpected.length > 0 && `unexpected: ${unexpected.join(', ')}`,
    ]
      .filter(Boolean)
      .join(' '),
  )
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')

await writeFile(
  join(outDir, 'openapi.public.json'),
  JSON.stringify(document) + '\n',
)
