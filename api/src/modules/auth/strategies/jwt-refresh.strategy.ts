import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { AuthConfig } from '../../../config/auth.config';
import { SessionsService } from '../../sessions/sessions.service';
import { JwtRefreshPayloadType } from './types/jwt-refresh-payload.type';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private readonly sessionsService: SessionsService,
  ) {
    const authConfig = configService.getOrThrow<AuthConfig>('auth');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: authConfig.API_JWT_REFRESH_SECRET,
    });
  }

  async validate(payload: JwtRefreshPayloadType) {
    if (!payload.sessionId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.sessionsService.findById(payload.sessionId);

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.hash !== payload.hash) {
      throw new UnauthorizedException('Invalid session hash');
    }

    if (!session.user) {
      throw new UnauthorizedException('User not found');
    }

    const user = session.user;

    return {
      user,
      session,
    };
  }
}
