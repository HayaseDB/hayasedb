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
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import type { JwtRefreshPayloadType } from './types/jwt-refresh-payload.type';

const createJwtRefreshPayload = (
  overrides: Partial<JwtRefreshPayloadType> = {},
): JwtRefreshPayloadType => ({
  sessionId: 'session-1',
  hash: 'valid-hash',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  ...overrides,
});

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;
  let mockSessionsService: jest.Mocked<SessionsService>;

  beforeEach(async () => {
    resetSessionFactory();
    resetUserFactory();

    mockSessionsService = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<SessionsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtRefreshStrategy,
        { provide: ConfigService, useValue: createMockConfigService() },
        { provide: SessionsService, useValue: mockSessionsService },
      ],
    }).compile();

    strategy = module.get<JwtRefreshStrategy>(JwtRefreshStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user and session for valid refresh token', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession({
        user: mockUser,
        hash: 'valid-hash',
      });
      mockSessionsService.findById.mockResolvedValue(mockSession);

      const payload = createJwtRefreshPayload({
        sessionId: mockSession.id,
        hash: 'valid-hash',
      });
      const result = await strategy.validate(payload);

      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
      });
    });

    it('should throw UnauthorizedException when sessionId is missing', async () => {
      const payload = createJwtRefreshPayload({
        sessionId: '',
        hash: 'valid-hash',
      });

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );
    });

    it('should throw UnauthorizedException when session not found', async () => {
      mockSessionsService.findById.mockResolvedValue(null);

      const payload = createJwtRefreshPayload({
        sessionId: 'session-1',
        hash: 'valid-hash',
      });

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Session not found'),
      );
    });

    it('should throw UnauthorizedException when session hash does not match', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession({
        user: mockUser,
        hash: 'correct-hash',
      });
      mockSessionsService.findById.mockResolvedValue(mockSession);

      const payload = createJwtRefreshPayload({
        sessionId: mockSession.id,
        hash: 'wrong-hash',
      });

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Invalid session hash'),
      );
    });

    it('should throw UnauthorizedException when session has no user', async () => {
      const mockSession = createMockSession({ hash: 'valid-hash' });
      (mockSession as unknown as { user: null }).user = null;
      mockSessionsService.findById.mockResolvedValue(mockSession);

      const payload = createJwtRefreshPayload({
        sessionId: mockSession.id,
        hash: 'valid-hash',
      });

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });

    it('should call findById with correct sessionId', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession({
        user: mockUser,
        hash: 'valid-hash',
      });
      mockSessionsService.findById.mockResolvedValue(mockSession);

      const payload = createJwtRefreshPayload({
        sessionId: 'specific-session',
        hash: 'valid-hash',
      });
      await strategy.validate(payload);

      expect(mockSessionsService.findById).toHaveBeenCalledWith(
        'specific-session',
      );
    });

    it('should compare hash correctly', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession({
        user: mockUser,
        hash: 'exact-hash-value',
      });
      mockSessionsService.findById.mockResolvedValue(mockSession);

      const payload = createJwtRefreshPayload({
        sessionId: mockSession.id,
        hash: 'exact-hash-value',
      });
      const result = await strategy.validate(payload);

      expect(result.session.hash).toBe('exact-hash-value');
    });
  });
});
