import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ActiveUser } from '../../common/decorators/active-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import { RbacGuard } from '../rbac/guards/rbac.guard';
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
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth('access_token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/profile')
  @Permission(['users@read:own'])
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  getProfile(@ActiveUser() user: User): User {
    return user;
  }

  @Patch('me/profile')
  @Permission(['users@update:own'])
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async updateProfile(
    @ActiveUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Put('me/password')
  @Permission(['users@update:own'])
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async changePassword(
    @ActiveUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.usersService.changePassword(user.id, changePasswordDto);
  }

  @Post('me/profile-picture')
  @Permission(['users@update:own'])
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
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
    description: 'Profile picture uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 413, description: 'File too large' })
  @ApiResponse({ status: 415, description: 'Unsupported media type' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async uploadProfilePicture(
    @ActiveUser() user: User,
    @UploadedFile(ProfilePictureValidationPipe)
    file: Express.Multer.File,
  ): Promise<User> {
    return this.usersService.uploadProfilePicture(user.id, file);
  }

  @Delete('me/profile-picture')
  @Permission(['users@update:own'])
  @ApiOperation({ summary: 'Delete profile picture' })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
    description: 'Profile picture deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'No profile picture to delete' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async deleteProfilePicture(@ActiveUser() user: User): Promise<User> {
    return this.usersService.deleteProfilePicture(user.id);
  }

  @Delete('me')
  @Permission(['users@delete:own'])
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async deleteAccount(
    @ActiveUser() user: User,
    @Body() deleteAccountDto: DeleteAccountDto,
  ): Promise<{ message: string }> {
    await this.usersService.deleteAccount(user.id, deleteAccountDto);
    return { message: 'Account deleted successfully' };
  }
}
