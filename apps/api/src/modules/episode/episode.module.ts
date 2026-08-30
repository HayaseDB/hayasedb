import { Module } from '@nestjs/common'
import { RevisionModule } from '../revision/revision.module'
import { EpisodeController } from './episode.controller'
import { EpisodeService } from './episode.service'

@Module({
  imports: [RevisionModule],
  controllers: [EpisodeController],
  providers: [EpisodeService],
  exports: [EpisodeService],
})
export class EpisodeModule {}
