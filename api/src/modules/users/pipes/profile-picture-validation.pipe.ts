import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  PipeTransform,
  UnsupportedMediaTypeException,
} from '@nestjs/common';

import {
  PROFILE_PICTURE_ALLOWED_MIME_TYPES,
  PROFILE_PICTURE_MAX_SIZE,
  ProfilePictureMimeType,
} from '../constants/profile-picture.constants';

@Injectable()
export class ProfilePictureValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Profile picture file is required');
    }

    if (file.size > PROFILE_PICTURE_MAX_SIZE) {
      throw new PayloadTooLargeException(
        `File size exceeds maximum allowed size of ${PROFILE_PICTURE_MAX_SIZE / (1024 * 1024)}MB`,
      );
    }

    if (
      !PROFILE_PICTURE_ALLOWED_MIME_TYPES.includes(
        file.mimetype as ProfilePictureMimeType,
      )
    ) {
      throw new UnsupportedMediaTypeException(
        `Invalid file type. Allowed types: ${PROFILE_PICTURE_ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    return file;
  }
}
