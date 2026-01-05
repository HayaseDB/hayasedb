import {
  Controller,
  Get,
  Header,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';

import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get(':bucket/*path')
  @Header('Cache-Control', 'public, max-age=31536000')
  async serveFile(
    @Param('bucket') bucket: string,
    @Param('path') key: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const metadata = await this.storageService.getMetadata(bucket, key);
    const stream = await this.storageService.download(bucket, key);

    res.set({
      'Content-Type': metadata.contentType,
      'Content-Length': metadata.size,
      ETag: metadata.etag,
    });

    return new StreamableFile(stream);
  }
}
