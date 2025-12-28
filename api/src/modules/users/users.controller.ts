import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Patch,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ActiveUser } from '../../common/decorators/active-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import { RbacGuard } from '../rbac/guards/rbac.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
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
}
