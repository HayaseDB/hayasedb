import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ActiveSession } from '../../common/decorators/active-session.decorator';
import { ActiveUser } from '../../common/decorators/active-user.decorator';
import { RequestMetadataDecorator } from '../../common/decorators/request-metadata.decorator';
import type { RequestMetadata } from '../../common/types/request-metadata.interface';
import { Session } from '../sessions/entities/session.entity';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CurrentUserResponseDto } from './dto/current-user-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';

@ApiTags('Auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Create a new user account. A verification email will be sent to confirm the email address.',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'User registration data',
  })
  @ApiResponse({
    status: 201,
    description: 'Verification email sent successfully',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    return await this.authService.register(registerDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description:
      'Verify the email address using the token sent to the user email. Returns authentication tokens on success.',
  })
  @ApiBody({
    type: VerifyEmailDto,
    description: 'Email verification token',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification token',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<AuthResponseDto> {
    return await this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend verification email',
    description:
      'Resend the verification email to the specified email address.',
  })
  @ApiBody({
    type: ResendVerificationDto,
    description: 'Email address to resend verification to',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent successfully',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Email is already verified',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<RegisterResponseDto> {
    return await this.authService.resendVerificationEmail(dto.email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description:
      'Authenticate with email and password. Email must be verified before login.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Login credentials',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(
    @Body() loginDto: LoginDto,
    @RequestMetadataDecorator() metadata: RequestMetadata,
  ): Promise<AuthResponseDto> {
    return await this.authService.validateLogin(loginDto, metadata);
  }

  @ApiBearerAuth('refresh_token')
  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate new access and refresh tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refresh(
    @ActiveSession() currentSession: Session,
  ): Promise<RefreshResponseDto> {
    return this.authService.refreshToken(currentSession.id);
  }

  @ApiBearerAuth('access_token')
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Logout user',
    description: 'Terminate current session and invalidate tokens',
  })
  @ApiResponse({
    status: 204,
    description: 'Logout successful',
  })
  async logout(@ActiveSession() currentSession: Session): Promise<void> {
    await this.authService.logout(currentSession.id);
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user information',
    description: 'Get authenticated user profile and session details',
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
    type: CurrentUserResponseDto,
  })
  me(
    @ActiveUser() user: User,
    @ActiveSession() session: Session,
  ): CurrentUserResponseDto {
    return {
      user,
      session: {
        id: session.id,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isCurrent: true,
      },
    };
  }
}
