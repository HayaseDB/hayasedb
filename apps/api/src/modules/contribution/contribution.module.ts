import { Module } from '@nestjs/common'
import { StorageModule } from '../../storage/storage.module'
import { AnimeModule } from '../anime/anime.module'
import { MediaModule } from '../media/media.module'
import { RevisionModule } from '../revision/revision.module'
import { UserModule } from '../user/user.module'
import { ChangesetDetailService } from './changeset-detail.service'
import { ContributionService } from './contribution.service'

@Module({
  imports: [
    StorageModule,
    RevisionModule,
    AnimeModule,
    MediaModule,
    UserModule,
  ],
  providers: [ContributionService, ChangesetDetailService],
  exports: [ContributionService, ChangesetDetailService],
})
export class ContributionModule {}
