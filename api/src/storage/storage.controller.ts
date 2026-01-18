import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { Public } from '../modules/rbac/decorators/public.decorator';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@Controller('storage')
@Public()
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get(':bucket/*path')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'public, max-age=31536000')
  @ApiOperation({ summary: 'Serve a file from storage' })
  @ApiParam({ name: 'bucket', description: 'Storage bucket name' })
  @ApiParam({ name: 'path', description: 'File path within the bucket' })
  @ApiOkResponse({ description: 'File stream returned successfully' })
  @ApiNotFoundResponse({ description: 'File not found' })
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
