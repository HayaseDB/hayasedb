import { Controller, Get } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { DocsService } from './docs.service'

@Controller()
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @AllowAnonymous()
  @Get('openapi.json')
  openapi(): Promise<Record<string, unknown>> {
    return this.docsService.getSpec()
  }
}
