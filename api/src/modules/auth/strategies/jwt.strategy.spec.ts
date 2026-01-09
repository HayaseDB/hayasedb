import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { createMockConfigService } from '../../../../test/mocks';
import {
  createMockSession,
  resetSessionFactory,
} from '../../../../test/factories';
import { createMockUser, resetUserFactory } from '../../../../test/factories';
import { SessionsService } from '../../sessions/sessions.service';
import { JwtStrategy } from './jwt.strategy';
import type { JwtPayloadType } from './types/jwt-payload.type';

const createJwtPayload = (
  overrides: Partial<JwtPayloadType> = {},
): JwtPayloadType => ({
  sub: 'user-1',
  sessionId: 'session-1',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  ...overrides,
});

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockSessionsService: jest.Mocked<SessionsService>;

  beforeEach(async () => {
    resetSessionFactory();
    resetUserFactory();

    mockSessionsService = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<SessionsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: createMockConfigService() },
        { provide: SessionsService, useValue: mockSessionsService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user and session for valid session', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession({ user: mockUser });
      mockSessionsService.findById.mockResolvedValue(mockSession);

      const payload = createJwtPayload({
        sub: mockUser.id,
        sessionId: mockSession.id,
      });
      const result = await strategy.validate(payload);

      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
      });
    });

    it('should throw UnauthorizedException when session not found', async () => {
      mockSessionsService.findById.mockResolvedValue(null);

      const payload = createJwtPayload({
        sub: 'user-1',
        sessionId: 'invalid-session',
      });

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Session not found'),
      );
    });

    it('should throw UnauthorizedException when session has no user', async () => {
      const mockSession = createMockSession();
      (mockSession as unknown as { user: null }).user = null;
      mockSessionsService.findById.mockResolvedValue(mockSession);

      const payload = createJwtPayload({
        sub: 'user-1',
        sessionId: 'session-1',
      });

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });

    it('should call findById with correct sessionId', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession({ user: mockUser });
      mockSessionsService.findById.mockResolvedValue(mockSession);

      const payload = createJwtPayload({
        sub: mockUser.id,
        sessionId: 'specific-session-id',
      });
      await strategy.validate(payload);

      expect(mockSessionsService.findById).toHaveBeenCalledWith(
        'specific-session-id',
      );
    });

    it('should extract user from session', async () => {
      const mockUser = createMockUser({
        id: 'user-123',
        email: 'test@example.com',
      });
      const mockSession = createMockSession({ user: mockUser });
      mockSessionsService.findById.mockResolvedValue(mockSession);

      const payload = createJwtPayload({
        sub: mockUser.id,
        sessionId: mockSession.id,
      });
      const result = await strategy.validate(payload);

      expect(result.user).toEqual(mockUser);
      expect(result.user.id).toBe('user-123');
      expect(result.user.email).toBe('test@example.com');
    });
  });
});
