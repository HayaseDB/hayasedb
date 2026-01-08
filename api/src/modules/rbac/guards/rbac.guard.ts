import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { Session } from '../../sessions/entities/session.entity';
import { User } from '../../users/entities/user.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Role } from '../enums/role.enum';
import { RbacService } from '../rbac.service';
import { Permission, RoleKey } from '../rbac.types';

interface AuthenticatedRequest extends Request {
  user?: {
    user: User;
    session: Session;
  };
  roles?: RoleKey[];
}

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const permissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!permissions?.length) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const userData = request.user;

    if (!userData?.user) {
      throw new ForbiddenException('Authentication required');
    }

    const role = userData.user.role ?? Role.USER;
    const roleKey: RoleKey = `global:${role}`;

    const roles: RoleKey[] = [roleKey];
    request.roles = roles;

    if (!this.rbacService.hasAnyPermission(roles, permissions)) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${permissions.join(' or ')}`,
      );
    }

    return true;
  }
}
