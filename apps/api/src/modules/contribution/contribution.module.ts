import { Module } from '@nestjs/common'
import { AnimeModule } from '../anime/anime.module'
import { MediaModule } from '../media/media.module'
import { RevisionModule } from '../revision/revision.module'
import { UserModule } from '../user/user.module'
import { ChangesetDetailService } from './changeset-detail.service'
import { ContributionService } from './contribution.service'

@Module({
  imports: [RevisionModule, AnimeModule, MediaModule, UserModule],
  providers: [ContributionService, ChangesetDetailService],
  exports: [ContributionService, ChangesetDetailService],
})
export class ContributionModule {}
