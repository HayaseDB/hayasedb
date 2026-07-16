import { Module } from '@nestjs/common'
import { StorageModule } from '../../storage/storage.module'
import { MediaService } from './media.service'

@Module({
  imports: [StorageModule],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
