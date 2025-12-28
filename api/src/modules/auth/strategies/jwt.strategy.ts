import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { AuthConfig } from '../../../config/auth.config';
import { SessionsService } from '../../sessions/sessions.service';
import { JwtPayloadType } from './types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly sessionsService: SessionsService,
  ) {
    const authConfig = configService.getOrThrow<AuthConfig>('auth');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: authConfig.API_JWT_SECRET,
    });
  }

  async validate(payload: JwtPayloadType) {
    const session = await this.sessionsService.findById(payload.sessionId);

    if (!session) {
      throw new UnauthorizedException('Session not found');
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
