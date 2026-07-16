import { Module } from '@nestjs/common'
import { MediaModule } from '../media/media.module'
import { ChangesetApplyService } from './changeset-apply.service'
import { DisplayService } from './display.service'
import { RevisionService } from './revision.service'

@Module({
  imports: [MediaModule],
  providers: [RevisionService, ChangesetApplyService, DisplayService],
  exports: [RevisionService, ChangesetApplyService, DisplayService],
})
export class RevisionModule {}
