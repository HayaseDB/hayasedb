import { ApiProperty } from '@nestjs/swagger';

import {
  PaginationLinksDto,
  PaginationMetaDto,
} from '../../../common/dto/pagination-meta.dto';
import { SessionResponseDto } from './session-response.dto';

export class PaginatedSessionResponseDto {
  @ApiProperty({
    description: 'List of session items',
    type: [SessionResponseDto],
  })
  items: SessionResponseDto[];

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
