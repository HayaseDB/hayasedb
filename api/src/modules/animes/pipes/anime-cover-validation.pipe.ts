import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  PipeTransform,
  UnsupportedMediaTypeException,
} from '@nestjs/common';

import {
  ANIME_COVER_ALLOWED_MIME_TYPES,
  ANIME_COVER_MAX_SIZE,
  AnimeCoverMimeType,
} from '../constants/anime-cover.constants';

@Injectable()
export class AnimeCoverValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Cover image file is required');
    }

    if (file.size > ANIME_COVER_MAX_SIZE) {
      throw new PayloadTooLargeException(
        `File size exceeds maximum allowed size of ${ANIME_COVER_MAX_SIZE / (1024 * 1024)}MB`,
      );
    }

    if (
      !ANIME_COVER_ALLOWED_MIME_TYPES.includes(
        file.mimetype as AnimeCoverMimeType,
      )
    ) {
      throw new UnsupportedMediaTypeException(
        `Invalid file type. Allowed types: ${ANIME_COVER_ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    return file;
  }
}
