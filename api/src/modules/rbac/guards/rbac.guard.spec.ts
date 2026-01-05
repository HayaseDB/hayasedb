import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { RbacGuard } from './rbac.guard';
import { RbacService } from '../rbac.service';
import { Role } from '../enums/role.enum';
import { createMockUser } from '../../../../test/factories/user.factory';

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let reflector: jest.Mocked<Reflector>;
  let rbacService: jest.Mocked<RbacService>;

  const createMockExecutionContext = (user?: {
    role: Role;
  }): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: RbacService,
          useValue: {
            canAny: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RbacGuard>(RbacGuard);
    reflector = module.get(Reflector);
    rbacService = module.get(RbacService);
  });

  it('should allow access to public routes', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true);
    const context = createMockExecutionContext();

    expect(guard.canActivate(context)).toBe(true);
    expect(rbacService.canAny).not.toHaveBeenCalled();
  });

  it('should allow access when no permissions are required', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(null);
    const context = createMockExecutionContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when empty permissions array is defined', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([]);
    const context = createMockExecutionContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user is not authenticated', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['users@read:own']);
    const context = createMockExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('User not authenticated'),
    );
  });

  it('should throw ForbiddenException when user lacks permission', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['users@read:any']);
    rbacService.canAny.mockReturnValue(false);

    const user = createMockUser({ role: Role.USER });
    const context = createMockExecutionContext(user);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access when user has required permission', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['users@read:own']);
    rbacService.canAny.mockReturnValue(true);

    const user = createMockUser({ role: Role.USER });
    const context = createMockExecutionContext(user);

    expect(guard.canActivate(context)).toBe(true);
    expect(rbacService.canAny).toHaveBeenCalledWith(Role.USER, [
      'users@read:own',
    ]);
  });

  it('should check canAny with all required permissions', () => {
    const permissions = ['users@read:own', 'users@update:own'];
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(permissions);
    rbacService.canAny.mockReturnValue(true);

    const user = createMockUser({ role: Role.ADMINISTRATOR });
    const context = createMockExecutionContext(user);

    guard.canActivate(context);

    expect(rbacService.canAny).toHaveBeenCalledWith(
      Role.ADMINISTRATOR,
      permissions,
    );
  });
});
