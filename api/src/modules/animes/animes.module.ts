import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StorageModule } from '../../storage/storage.module';
import { GenresModule } from '../genres/genres.module';
import { MediaModule } from '../media/media.module';
import { AnimesController } from './animes.controller';
import { AnimesService } from './animes.service';
import { Anime } from './entities/anime.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Anime]),
    forwardRef(() => GenresModule),
    MediaModule,
    StorageModule,
  ],
  controllers: [AnimesController],
  providers: [AnimesService],
  exports: [AnimesService],
})
export class AnimesModule {}
