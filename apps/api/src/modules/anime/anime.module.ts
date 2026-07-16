import { Module } from '@nestjs/common'
import { StorageModule } from '../../storage/storage.module'
import { MediaModule } from '../media/media.module'
import { RevisionModule } from '../revision/revision.module'
import { AnimeController } from './anime.controller'
import { AnimeService } from './anime.service'

@Module({
  imports: [StorageModule, RevisionModule, MediaModule],
  controllers: [AnimeController],
  providers: [AnimeService],
  exports: [AnimeService],
})
export class AnimeModule {}
