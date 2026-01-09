import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';

import {
  createMockSession,
  resetSessionFactory,
} from '../../../../test/factories';
import { createMockUser, resetUserFactory } from '../../../../test/factories';
import { IS_PUBLIC_KEY } from '../../rbac/decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockReflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    resetUserFactory();
    resetSessionFactory();

    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);

    jest.spyOn(AuthGuard('jwt').prototype, 'canActivate').mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  interface MockRequest {
    session?: unknown;
  }

  const createMockExecutionContext = (): ExecutionContext => {
    const mockRequest: MockRequest = {};
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
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
    it('should return true for public routes', () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);
      const context = createMockExecutionContext();

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );
    });

    it('should check IS_PUBLIC_KEY metadata on handler and class', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);
      const context = createMockExecutionContext();
      const mockHandler = jest.fn();
      const mockClass = jest.fn();
      (context.getHandler as jest.Mock).mockReturnValue(mockHandler);
      (context.getClass as jest.Mock).mockReturnValue(mockClass);

      await guard.canActivate(context);

      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        [mockHandler, mockClass],
      );
    });

    it('should return true immediately when isPublic is true (short circuit)', () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);
      const context = createMockExecutionContext();

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should call super.canActivate when route is not public', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const context = createMockExecutionContext();
      const superCanActivateSpy = jest.spyOn(
        AuthGuard('jwt').prototype,
        'canActivate',
      );

      await guard.canActivate(context);

      expect(superCanActivateSpy).toHaveBeenCalledWith(context);
    });
  });

  describe('handleRequest', () => {
    it('should return user when payload is valid', () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession({ user: mockUser });
      const context = createMockExecutionContext();

      const result = guard.handleRequest(
        null,
        { user: mockUser, session: mockSession },
        null,
        context,
      );

      expect(result).toEqual(mockUser);
    });

    it('should set session on request when payload is valid', () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession({ user: mockUser });
      const context = createMockExecutionContext();
      const mockRequest = context.switchToHttp().getRequest<MockRequest>();

      guard.handleRequest(
        null,
        { user: mockUser, session: mockSession },
        null,
        context,
      );

      expect(mockRequest.session).toEqual(mockSession);
    });

    it('should throw error when error is provided', () => {
      const context = createMockExecutionContext();
      const error = new Error('Auth error');

      expect(() => guard.handleRequest(error, null, null, context)).toThrow(
        error,
      );
    });

    it('should throw UnauthorizedException when payload is null', () => {
      const context = createMockExecutionContext();

      expect(() => guard.handleRequest(null, null, null, context)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when payload is false', () => {
      const context = createMockExecutionContext();

      expect(() =>
        guard.handleRequest(null, false as never, null, context),
      ).toThrow(UnauthorizedException);
    });

    it('should throw provided error over UnauthorizedException', () => {
      const context = createMockExecutionContext();
      const customError = new Error('Custom auth error');

      expect(() =>
        guard.handleRequest(customError, null, null, context),
      ).toThrow('Custom auth error');
    });
  });
});
