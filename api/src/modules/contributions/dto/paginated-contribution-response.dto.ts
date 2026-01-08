import { ApiProperty } from '@nestjs/swagger';

import {
  PaginationLinksDto,
  PaginationMetaDto,
} from '../../../common/dto/pagination-meta.dto';
import { ContributionResponseDto } from './contribution-response.dto';

export class PaginatedContributionResponseDto {
  @ApiProperty({
    description: 'List of contribution items',
    type: [ContributionResponseDto],
  })
  items: ContributionResponseDto[];

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
