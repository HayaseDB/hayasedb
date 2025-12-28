import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Session } from '../../sessions/entities/session.entity';
import { User } from '../../users/entities/user.entity';

interface AuthenticatedRequest {
  user: User;
  session: Session;
}

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  handleRequest<TUser = never>(
    error: Error | null,
    payload: { user: User; session: Session } | null,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (error || !payload) {
      throw error ?? new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.session = payload.session;

    return payload.user as TUser;
  }
}
