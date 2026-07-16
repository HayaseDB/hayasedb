import { Module } from '@nestjs/common'
import { StorageModule } from '../../storage/storage.module'
import { RevisionModule } from '../revision/revision.module'
import { AnimeController } from './anime.controller'
import { AnimeService } from './anime.service'
import { MediaService } from './media.service'

@Module({
  imports: [StorageModule, RevisionModule],
  controllers: [AnimeController],
  providers: [AnimeService, MediaService],
  exports: [AnimeService, MediaService],
})
export class AnimeModule {}
