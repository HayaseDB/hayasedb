import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { createMockUser, resetUserFactory } from '../../../../test/factories';
import {
  createMockSession,
  resetSessionFactory,
} from '../../../../test/factories';
import { Role } from '../enums/role.enum';
import { RbacService } from '../rbac.service';
import { RbacGuard } from './rbac.guard';
import type { Permission } from '../rbac.types';

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let mockReflector: jest.Mocked<Reflector>;
  let mockRbacService: jest.Mocked<RbacService>;

  beforeEach(async () => {
    resetUserFactory();
    resetSessionFactory();

    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    mockRbacService = {
      hasAnyPermission: jest.fn(),
    } as unknown as jest.Mocked<RbacService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: RbacService, useValue: mockRbacService },
      ],
    }).compile();

    guard = module.get<RbacGuard>(RbacGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  interface MockRequest {
    user?: {
      user: ReturnType<typeof createMockUser>;
      session: ReturnType<typeof createMockSession>;
    };
    roles?: string[];
  }

  const createMockExecutionContext = (
    request: MockRequest = {},
  ): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
        getResponse: jest.fn().mockReturnValue({}),
        getNext: jest.fn(),
      }),
      getArgs: jest.fn().mockReturnValue([]),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should return true when no permissions are required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockExecutionContext();

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when permissions array is empty', () => {
      mockReflector.getAllAndOverride.mockReturnValue([]);
      const context = createMockExecutionContext();

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        'global:users.read:any' as Permission,
      ]);
      const context = createMockExecutionContext({});

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('Authentication required'),
      );
    });

    it('should throw ForbiddenException when user data is incomplete', () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        'global:users.read:any' as Permission,
      ]);
      const context = createMockExecutionContext({
        user: undefined,
      });

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('Authentication required'),
      );
    });

    it('should return true when user has required permission', () => {
      const mockUser = createMockUser({ role: Role.USER });
      const mockSession = createMockSession({ user: mockUser });
      mockReflector.getAllAndOverride.mockReturnValue([
        'global:users.read:own' as Permission,
      ]);
      mockRbacService.hasAnyPermission.mockReturnValue(true);

      const context = createMockExecutionContext({
        user: { user: mockUser, session: mockSession },
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user lacks permission', () => {
      const mockUser = createMockUser({ role: Role.USER });
      const mockSession = createMockSession({ user: mockUser });
      mockReflector.getAllAndOverride.mockReturnValue([
        'global:users.read:any' as Permission,
      ]);
      mockRbacService.hasAnyPermission.mockReturnValue(false);

      const context = createMockExecutionContext({
        user: { user: mockUser, session: mockSession },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should include permission info in error message', () => {
      const mockUser = createMockUser({ role: Role.USER });
      const mockSession = createMockSession({ user: mockUser });
      const permissions = [
        'global:users.read:any' as Permission,
        'global:users.delete:any' as Permission,
      ];
      mockReflector.getAllAndOverride.mockReturnValue(permissions);
      mockRbacService.hasAnyPermission.mockReturnValue(false);

      const context = createMockExecutionContext({
        user: { user: mockUser, session: mockSession },
      });

      expect(() => guard.canActivate(context)).toThrow(
        /global:users\.read:any or global:users\.delete:any/,
      );
    });

    it('should use USER role when user has no role set', () => {
      const mockUser = createMockUser();
      (mockUser as unknown as { role: undefined }).role = undefined;
      const mockSession = createMockSession({ user: mockUser });
      mockReflector.getAllAndOverride.mockReturnValue([
        'global:users.read:own' as Permission,
      ]);
      mockRbacService.hasAnyPermission.mockReturnValue(true);

      const context = createMockExecutionContext({
        user: { user: mockUser, session: mockSession },
      });

      guard.canActivate(context);

      expect(mockRbacService.hasAnyPermission).toHaveBeenCalledWith(
        ['global:user'],
        ['global:users.read:own'],
      );
    });

    it('should set roles on request object', () => {
      const mockUser = createMockUser({ role: Role.ADMINISTRATOR });
      const mockSession = createMockSession({ user: mockUser });
      mockReflector.getAllAndOverride.mockReturnValue([
        'global:users.read:any' as Permission,
      ]);
      mockRbacService.hasAnyPermission.mockReturnValue(true);

      const request: MockRequest = {
        user: { user: mockUser, session: mockSession },
      };
      const context = createMockExecutionContext(request);

      guard.canActivate(context);

      expect(request.roles).toEqual(['global:administrator']);
    });

    it('should call hasAnyPermission with correct role key', () => {
      const mockUser = createMockUser({ role: Role.MODERATOR });
      const mockSession = createMockSession({ user: mockUser });
      const permissions = ['global:animes.create' as Permission];
      mockReflector.getAllAndOverride.mockReturnValue(permissions);
      mockRbacService.hasAnyPermission.mockReturnValue(true);

      const context = createMockExecutionContext({
        user: { user: mockUser, session: mockSession },
      });

      guard.canActivate(context);

      expect(mockRbacService.hasAnyPermission).toHaveBeenCalledWith(
        ['global:moderator'],
        permissions,
      );
    });
  });
});
