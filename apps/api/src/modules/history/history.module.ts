import { Module } from '@nestjs/common'
import { RevisionModule } from '../revision/revision.module'
import { UserModule } from '../user/user.module'
import { HistoryService } from './history.service'

@Module({
  imports: [RevisionModule, UserModule],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
