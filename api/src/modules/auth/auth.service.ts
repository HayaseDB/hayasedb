import * as crypto from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import ms, { type StringValue } from 'ms';

import type { RequestMetadata } from '../../common/types/request-metadata.interface';
import type { AuthConfig } from '../../config/auth.config';
import { MailService } from '../../mail/mail.service';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async validateLogin(loginDto: LoginDto, metadata?: RequestMetadata) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validateCredentials(
      loginDto.email,
      loginDto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Email not verified. Please check your inbox for the verification email.',
      );
    }

    const hash = this.generateSessionHash();

    const session = await this.sessionsService.create({
      userId: user.id,
      hash,
    });

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      userId: user.id,
      sessionId: session.id,
      hash,
    });

    if (metadata) {
      void this.mailService.sendLoginNotificationEmail(user, {
        timestamp: new Date(metadata.timestamp),
        device: `${metadata.os} - ${metadata.deviceType}`,
        location: 'Unknown',
        ipAddress: metadata.ipAddress,
        browser: metadata.browser || 'Unknown',
      });
    }

    return {
      token,
      refreshToken,
      tokenExpires,
      user,
    };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    const verificationToken = await this.usersService.generateVerificationToken(
      user.id,
    );

    await this.mailService.sendVerificationEmail(user, verificationToken);

    return {
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.verifyEmail(token);

    const hash = this.generateSessionHash();

    const session = await this.sessionsService.create({
      userId: user.id,
      hash,
    });

    const {
      token: accessToken,
      refreshToken,
      tokenExpires,
    } = await this.getTokensData({
      userId: user.id,
      sessionId: session.id,
      hash,
    });

    void this.mailService.sendWelcomeEmail(user);

    return {
      token: accessToken,
      refreshToken,
      tokenExpires,
      user,
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken = await this.usersService.generateVerificationToken(
      user.id,
    );

    await this.mailService.sendVerificationEmail(user, verificationToken);

    return {
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  async refreshToken(sessionId: string) {
    const hash = this.generateSessionHash();

    const session = await this.sessionsService.update(sessionId, { hash });

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      userId: session.user.id,
      sessionId: session.id,
      hash,
    });

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  async logout(sessionId: string) {
    await this.sessionsService.deleteById(sessionId);
    return true;
  }

  private generateSessionHash(): string {
    return crypto
      .createHash('sha256')
      .update(crypto.randomBytes(32).toString('hex'))
      .digest('hex');
  }

  private async getTokensData(data: {
    userId: string;
    sessionId: string;
    hash: string;
  }): Promise<{
    token: string;
    refreshToken: string;
    tokenExpires: number;
  }> {
    const authConfig = this.configService.getOrThrow<AuthConfig>('auth');
    const tokenExpiresIn = authConfig.API_JWT_EXPIRES_IN;

    const tokenExpires = Date.now() + Number(ms(tokenExpiresIn as StringValue));

    const tokenOptions: JwtSignOptions = {
      secret: authConfig.API_JWT_SECRET,
      expiresIn: tokenExpiresIn as StringValue,
    };

    const refreshTokenOptions: JwtSignOptions = {
      secret: authConfig.API_JWT_REFRESH_SECRET,
      expiresIn: authConfig.API_JWT_REFRESH_EXPIRES_IN as StringValue,
    };

    const [token, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: data.userId,
          sessionId: data.sessionId,
        },
        tokenOptions,
      ),
      this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
          hash: data.hash,
        },
        refreshTokenOptions,
      ),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }
}
