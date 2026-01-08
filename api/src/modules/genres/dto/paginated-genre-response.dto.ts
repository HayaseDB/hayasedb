import { ApiProperty } from '@nestjs/swagger';

import {
  PaginationLinksDto,
  PaginationMetaDto,
} from '../../../common/dto/pagination-meta.dto';
import { GenreResponseDto } from './genre-response.dto';

export class PaginatedGenreResponseDto {
  @ApiProperty({
    description: 'List of genre items',
    type: [GenreResponseDto],
  })
  items: GenreResponseDto[];

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
