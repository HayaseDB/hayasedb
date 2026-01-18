import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';

import { ActiveUser } from '../../common/decorators/active-user.decorator';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import {
  PROFILE_PICTURE_ALLOWED_MIME_TYPES,
  PROFILE_PICTURE_MAX_SIZE,
} from './constants/profile-picture.constants';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import { ProfilePictureValidationPipe } from './pipes/profile-picture-validation.pipe';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth('access_token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Permissions(['global:users.read:own'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  getProfile(@ActiveUser() user: User): User {
    return user;
  }

  @Patch('me')
  @Permissions(['global:users.update:own'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async updateProfile(
    @ActiveUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Patch('me/password')
  @Permissions(['global:users.update:own'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiOkResponse({ description: 'Password changed successfully' })
  @ApiUnauthorizedResponse({ description: 'Current password is incorrect' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async changePassword(
    @ActiveUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.usersService.changePassword(user.id, changePasswordDto);
  }

  @Post('me/profile-picture')
  @Permissions(['global:users.update:own'])
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: PROFILE_PICTURE_MAX_SIZE,
      },
    }),
  )
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: `Profile picture image (max ${PROFILE_PICTURE_MAX_SIZE / (1024 * 1024)}MB, allowed: ${PROFILE_PICTURE_ALLOWED_MIME_TYPES.join(', ')})`,
        },
      },
    },
  })
  @ApiOkResponse({
    type: UserResponseDto,
    description: 'Profile picture uploaded successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid file' })
  @ApiPayloadTooLargeResponse({ description: 'File too large' })
  @ApiUnsupportedMediaTypeResponse({ description: 'Unsupported media type' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async uploadProfilePicture(
    @ActiveUser() user: User,
    @UploadedFile(ProfilePictureValidationPipe)
    file: Express.Multer.File,
  ): Promise<User> {
    return this.usersService.uploadProfilePicture(user.id, file);
  }

  @Delete('me/profile-picture')
  @Permissions(['global:users.update:own'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete profile picture' })
  @ApiOkResponse({
    type: UserResponseDto,
    description: 'Profile picture deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'No profile picture to delete' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async deleteProfilePicture(@ActiveUser() user: User): Promise<User> {
    return this.usersService.deleteProfilePicture(user.id);
  }

  @Delete('me')
  @Permissions(['global:users.delete:own'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiOkResponse({ description: 'Account deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid password' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async deleteAccount(
    @ActiveUser() user: User,
    @Body() deleteAccountDto: DeleteAccountDto,
  ): Promise<{ message: string }> {
    await this.usersService.deleteAccount(user.id, deleteAccountDto);
    return { message: 'Account deleted successfully' };
  }
}
