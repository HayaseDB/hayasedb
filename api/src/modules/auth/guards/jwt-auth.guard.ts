import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from '../../rbac/decorators/public.decorator';
import { Session } from '../../sessions/entities/session.entity';
import { User } from '../../users/entities/user.entity';

interface AuthenticatedRequest {
  user: User;
  session: Session;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

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
