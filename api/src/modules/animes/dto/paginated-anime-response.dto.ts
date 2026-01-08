import { ApiProperty } from '@nestjs/swagger';

import {
  PaginationLinksDto,
  PaginationMetaDto,
} from '../../../common/dto/pagination-meta.dto';
import { AnimeResponseDto } from './anime-response.dto';

export class PaginatedAnimeResponseDto {
  @ApiProperty({
    description: 'List of anime items',
    type: [AnimeResponseDto],
  })
  items: AnimeResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;

  @ApiProperty({
    description: 'Pagination links',
    type: PaginationLinksDto,
  })
  links: PaginationLinksDto;
}
