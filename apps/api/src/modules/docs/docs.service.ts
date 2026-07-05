import { Inject, Injectable } from '@nestjs/common'
import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod'
import { contract } from '@hayasedb/contract'
import { APP_CONFIG, type AppEnv } from '../../config/config.constants'

@Injectable()
export class DocsService {
  private readonly generator = new OpenAPIGenerator({
    converters: [new ZodToJsonSchemaConverter()],
  })

  private spec?: Promise<Record<string, unknown>>

  constructor(@Inject(APP_CONFIG) private readonly env: AppEnv) {}

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
        servers: [{ url: this.env.API_PUBLIC_URL }],
      },
    })
    return spec as unknown as Record<string, unknown>
  }
}
