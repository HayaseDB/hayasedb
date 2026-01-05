import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediaResponseDto {
  @ApiProperty({
    description: 'Media ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Storage bucket name',
    example: 'avatars',
  })
  bucket: string;

  @ApiProperty({
    description: 'Storage key/path',
    example: 'user-id/1704067200000.webp',
  })
  key: string;

  @ApiProperty({
    description: 'Original file name',
    example: 'profile-photo.jpg',
  })
  originalName: string;

  @ApiProperty({
    description: 'MIME type',
    example: 'image/webp',
  })
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 102400,
  })
  size: number;

  @ApiPropertyOptional({
    description: 'ETag hash',
    example: '"abc123def456"',
    nullable: true,
  })
  etag: string | null;

  @ApiPropertyOptional({
    description: 'Public URL to access the media',
    example: 'https://cdn.example.com/avatars/user-id/1704067200000.webp',
    nullable: true,
  })
  url: string | null;
}
