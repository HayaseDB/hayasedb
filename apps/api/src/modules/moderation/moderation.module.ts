import { Module } from '@nestjs/common'
import { StorageModule } from '../../storage/storage.module'
import { ContributionModule } from '../contribution/contribution.module'
import { HistoryModule } from '../history/history.module'
import { RevisionModule } from '../revision/revision.module'
import { ChangesetController } from './changeset.controller'
import { MediaController } from './media.controller'
import { ModerationService } from './moderation.service'
import { RevisionController } from './revision.controller'

@Module({
  imports: [StorageModule, RevisionModule, ContributionModule, HistoryModule],
  controllers: [ChangesetController, RevisionController, MediaController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
