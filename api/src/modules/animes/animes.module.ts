import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GenresModule } from '../genres/genres.module';
import { AnimesController } from './animes.controller';
import { AnimesService } from './animes.service';
import { Anime } from './entities/anime.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Anime]), forwardRef(() => GenresModule)],
  controllers: [AnimesController],
  providers: [AnimesService],
  exports: [AnimesService],
})
export class AnimesModule {}
