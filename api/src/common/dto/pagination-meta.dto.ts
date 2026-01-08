import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Number of items in the current page',
    example: 20,
  })
  itemCount: number;

  @ApiProperty({
    description: 'Total number of items across all pages',
    example: 100,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  itemsPerPage: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  currentPage: number;
}

export class PaginationLinksDto {
  @ApiProperty({
    description: 'URL to the first page',
    example: '/animes?page=1&limit=20',
  })
  first: string;

  @ApiProperty({
    description: 'URL to the previous page',
    example: '',
  })
  previous: string;

  @ApiProperty({
    description: 'URL to the next page',
    example: '/animes?page=2&limit=20',
  })
  next: string;

  @ApiProperty({
    description: 'URL to the last page',
    example: '/animes?page=5&limit=20',
  })
  last: string;
}
