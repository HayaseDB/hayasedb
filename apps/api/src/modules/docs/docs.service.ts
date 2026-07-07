import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod'
import { contract } from '@hayasedb/contract'
import type { Env } from '../../config/env.schema'

@Injectable()
export class DocsService {
  private readonly generator = new OpenAPIGenerator({
    converters: [new ZodToJsonSchemaConverter()],
  })

  private spec?: Promise<Record<string, unknown>>

  constructor(private readonly config: ConfigService<Env, true>) {}

  /**
   * Generates the OpenAPI spec from the shared oRPC contract. The contract is
   * static, so the generated spec is memoised for the lifetime of the process.
   */
  getSpec(): Promise<Record<string, unknown>> {
    this.spec ??= this.generate()
    return this.spec
  }

  private async generate(): Promise<Record<string, unknown>> {
    const spec = await this.generator.generate(contract, {
      base: {
        info: { title: 'HayaseDB API', version: '0.0.0' },
        servers: [{ url: this.config.get('API_PUBLIC_URL', { infer: true }) }],
      },
    })
    return spec as unknown as Record<string, unknown>
  }
}
