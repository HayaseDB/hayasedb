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

const generated = Object.keys(document.paths ?? {}).length
const expected = collectRoutes().filter((route) => route.apiKey).length

if (generated !== expected) {
  throw new Error(
    `Public OpenAPI document has ${generated} paths but the contract declares ${expected} api-key routes.`,
  )
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')

await writeFile(
  join(outDir, 'openapi.public.json'),
  JSON.stringify(document) + '\n',
)
