import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod'
import { AuthService } from '@thallesp/nestjs-better-auth'
import { contract } from '@hayasedb/contract'
import type { Env } from '../../config/env.schema'
import type { Auth } from '../../auth/auth'

type Operation = { tags?: string[] } & Record<string, unknown>
type PathItem = Record<string, Operation>

type OpenAPIDocument = {
  paths?: Record<string, PathItem>
  components?: { schemas?: Record<string, unknown> }
  tags?: { name: string; description?: string }[]
} & Record<string, unknown>

const TAGS = [
  {
    name: 'Authentication',
    description: 'Sign in, sign up, sessions, accounts, and social providers.',
  },
  { name: 'Admin', description: 'Administrative user management.' },
  { name: 'User', description: 'The authenticated user.' },
  { name: 'System', description: 'Service health and diagnostics.' },
]

@Injectable()
export class DocsService {
  private readonly generator = new OpenAPIGenerator({
    converters: [new ZodToJsonSchemaConverter()],
  })

  private spec?: Promise<OpenAPIDocument>

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly authService: AuthService<Auth>,
  ) {}

  getSpec(): Promise<OpenAPIDocument> {
    this.spec ??= this.generate()
    return this.spec
  }

  private async generate(): Promise<OpenAPIDocument> {
    const spec = (await this.generator.generate(contract, {
      base: {
        info: { title: 'HayaseDB API', version: '0.0.0' },
        servers: [
          { url: `${this.config.get('API_PUBLIC_URL', { infer: true })}/api` },
        ],
        tags: TAGS,
      },
    })) as unknown as OpenAPIDocument

    const authSpec =
      (await this.authService.api.generateOpenAPISchema()) as unknown as OpenAPIDocument

    spec.paths = {
      ...spec.paths,
      ...prefixAuthPaths(authSpec.paths),
    }
    spec.components = {
      ...spec.components,
      schemas: {
        ...spec.components?.schemas,
        ...authSpec.components?.schemas,
      },
    }

    return spec
  }
}

function prefixAuthPaths(
  paths: Record<string, PathItem> | undefined,
): Record<string, PathItem> {
  if (!paths) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(paths).map(([path, item]) => {
      const retagged: PathItem = Object.fromEntries(
        Object.entries(item).map(([method, operation]) => [
          method,
          {
            ...operation,
            tags: operation.tags?.map((tag) =>
              tag === 'Default' ? 'Authentication' : tag,
            ),
          },
        ]),
      )
      return [`/auth${path}`, retagged]
    }),
  )
}
