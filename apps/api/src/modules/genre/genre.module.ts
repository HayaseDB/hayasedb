import { Module } from '@nestjs/common'
import { RevisionModule } from '../revision/revision.module'
import { GenreController } from './genre.controller'
import { GenreService } from './genre.service'

@Module({
  imports: [RevisionModule],
  controllers: [GenreController],
  providers: [GenreService],
})
export class GenreModule {}
