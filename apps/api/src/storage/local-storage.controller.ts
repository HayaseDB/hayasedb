import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { STORAGE_PUBLIC_PATH, type StorageDriver } from '@hayasedb/storage'
import type { Response } from 'express'
import { OpenEndpoint } from '../auth/api-access.guard'
import { STORAGE } from './storage.constants'

@OpenEndpoint()
@AllowAnonymous()
@Controller(STORAGE_PUBLIC_PATH)
export class LocalStorageController {
  constructor(@Inject(STORAGE) private readonly storage: StorageDriver) {}

  @Get('*key')
  async serve(
    @Param('key') key: string | string[],
    @Res() res: Response,
  ): Promise<void> {
    if (this.storage.provider !== 'local') throw new NotFoundException()

    const object = await this.storage.get(
      Array.isArray(key) ? key.join('/') : key,
    )
    if (!object) throw new NotFoundException()

    res.setHeader('Content-Type', object.contentType)
    if (object.cacheControl) {
      res.setHeader('Cache-Control', object.cacheControl)
    }
    res.end(object.body)
  }
}
