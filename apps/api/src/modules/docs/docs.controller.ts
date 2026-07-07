import { Controller, Get } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { DocsService } from './docs.service'

@Controller()
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @AllowAnonymous()
  @Get('openapi.json')
  openapi() {
    return this.docsService.getSpec()
  }
}
