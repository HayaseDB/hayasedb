import { Module } from '@nestjs/common'
import { StorageModule } from '../../storage/storage.module'
import { ChangesetApplyService } from './changeset-apply.service'
import { DisplayService } from './display.service'
import { RevisionService } from './revision.service'

@Module({
  imports: [StorageModule],
  providers: [RevisionService, ChangesetApplyService, DisplayService],
  exports: [RevisionService, ChangesetApplyService, DisplayService],
})
export class RevisionModule {}
