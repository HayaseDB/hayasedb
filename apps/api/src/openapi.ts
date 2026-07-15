import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod'
import { contract } from '@hayasedb/contract'
import type { Auth } from './auth/auth'

const VERSION = '0.0.0'
const DESCRIPTION = 'HayaseDB HTTP API.'

type OpenApiInfo = { title: string; version: string; description: string }
type OpenApiDocument = {
  info?: Partial<OpenApiInfo>
  servers?: { url: string }[]
}

export async function buildOpenApiSources(
  authApi: Auth['api'],
  publicUrl: string,
): Promise<{ title: string; content: OpenApiDocument; default?: boolean }[]> {
  const servers = [{ url: `${publicUrl}/api` }]
  const info = (title: string): OpenApiInfo => ({
    title,
    version: VERSION,
    description: DESCRIPTION,
  })

  const generator = new OpenAPIGenerator({
    converters: [new ZodToJsonSchemaConverter()],
  })

  const [api, auth] = (await Promise.all([
    generator.generate(contract, {
      base: { info: info('HayaseDB API'), servers },
    }),
    authApi.generateOpenAPISchema(),
  ])) as unknown as [OpenApiDocument, OpenApiDocument]

  auth.info = info('HayaseDB Auth')
  auth.servers = servers

  return [
    { title: 'API', content: api, default: true },
    { title: 'Auth', content: auth },
  ]
}
