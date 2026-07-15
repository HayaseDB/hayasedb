import { Module } from '@nestjs/common'
import { StorageModule } from '../../storage/storage.module'
import { AnimeController } from './anime.controller'
import { AnimeService } from './anime.service'
import { MediaService } from './media.service'

@Module({
  imports: [StorageModule],
  controllers: [AnimeController],
  providers: [AnimeService, MediaService],
})
export class AnimeModule {}
