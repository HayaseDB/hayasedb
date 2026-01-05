import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StorageConfig } from '../../config/storage.config';
import { Media } from './entities/media.entity';
import { MediaUrlHolder } from './media-url.holder';
import { MediaService } from './media.service';

@Module({
  imports: [TypeOrmModule.forFeature([Media])],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const storageConfig = this.configService.get<StorageConfig>('storage');
    MediaUrlHolder.setCdnUrl(storageConfig?.API_CDN_URL ?? null);
  }
}
