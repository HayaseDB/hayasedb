import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { DeviceType } from '../../common/types/request-metadata.interface';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import {
  createMockUser,
  createUnverifiedUser,
  resetUserFactory,
} from '../../../test/factories/user.factory';
import {
  createMockSession,
  resetSessionFactory,
} from '../../../test/factories/session.factory';

jest.mock('../../mail/mail.service', () => ({
  MailService: jest.fn().mockImplementation(() => ({
    sendVerificationEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
    sendLoginNotificationEmail: jest.fn(),
  })),
}));

import { MailService } from '../../mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let sessionsService: jest.Mocked<SessionsService>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;

  const mockAuthConfig = {
    API_JWT_SECRET: 'test-jwt-secret',
    API_JWT_EXPIRES_IN: '15m',
    API_JWT_REFRESH_SECRET: 'test-refresh-secret',
    API_JWT_REFRESH_EXPIRES_IN: '7d',
  };

  beforeEach(async () => {
    resetUserFactory();
    resetSessionFactory();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            validateCredentials: jest.fn(),
            create: jest.fn(),
            generateVerificationToken: jest.fn(),
            verifyEmail: jest.fn(),
          },
        },
        {
          provide: SessionsService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            deleteById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue(mockAuthConfig),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
            sendWelcomeEmail: jest.fn(),
            sendLoginNotificationEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    sessionsService = module.get(SessionsService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);

    jest.clearAllMocks();
  });

  describe('validateLogin', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should return tokens and user on successful login', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession({ user: mockUser });

      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.validateCredentials.mockResolvedValue(mockUser);
      sessionsService.create.mockResolvedValue(mockSession);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.validateLogin(loginDto);

      expect(result).toHaveProperty('token', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result).toHaveProperty('tokenExpires');
      expect(result).toHaveProperty('user', mockUser);
      expect(sessionsService.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.validateLogin(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateLogin(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const mockUser = createMockUser();
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.validateCredentials.mockResolvedValue(null);

      await expect(service.validateLogin(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when email is not verified', async () => {
      const mockUser = createUnverifiedUser();
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.validateCredentials.mockResolvedValue(mockUser);

      await expect(service.validateLogin(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateLogin(loginDto)).rejects.toThrow(
        'Email not verified',
      );
    });

    it('should send login notification when metadata is provided', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession({ user: mockUser });
      const metadata = {
        timestamp: new Date(),
        os: 'Linux',
        deviceType: DeviceType.DESKTOP,
        ipAddress: '127.0.0.1',
        browser: 'Chrome',
        userAgent: 'Mozilla/5.0',
      };

      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.validateCredentials.mockResolvedValue(mockUser);
      sessionsService.create.mockResolvedValue(mockSession);
      jwtService.signAsync.mockResolvedValue('token');

      await service.validateLogin(loginDto, metadata);

      expect(mailService.sendLoginNotificationEmail).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          ipAddress: '127.0.0.1',
          browser: 'Chrome',
        }),
      );
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should create user and send verification email', async () => {
      const mockUser = createUnverifiedUser();
      usersService.create.mockResolvedValue(mockUser);
      usersService.generateVerificationToken.mockResolvedValue(
        'verification-token',
      );

      const result = await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(usersService.generateVerificationToken).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser,
        'verification-token',
      );
      expect(result).toHaveProperty('message');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and return tokens', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession({ user: mockUser });

      usersService.verifyEmail.mockResolvedValue(mockUser);
      sessionsService.create.mockResolvedValue(mockSession);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.verifyEmail('valid-token');

      expect(usersService.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(sessionsService.create).toHaveBeenCalled();
      expect(mailService.sendWelcomeEmail).toHaveBeenCalledWith(mockUser);
      expect(result).toHaveProperty('token', 'access-token');
      expect(result).toHaveProperty('user', mockUser);
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email for unverified user', async () => {
      const mockUser = createUnverifiedUser();
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.generateVerificationToken.mockResolvedValue('new-token');

      const result = await service.resendVerificationEmail(mockUser.email);

      expect(usersService.generateVerificationToken).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser,
        'new-token',
      );
      expect(result).toHaveProperty('message');
    });

    it('should throw NotFoundException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.resendVerificationEmail('notfound@example.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when email is already verified', async () => {
      const mockUser = createMockUser();
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.resendVerificationEmail(mockUser.email),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.resendVerificationEmail(mockUser.email),
      ).rejects.toThrow('Email is already verified');
    });
  });

  describe('refreshToken', () => {
    it('should update session hash and return new tokens', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession({ user: mockUser });

      sessionsService.update.mockResolvedValue(mockSession);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await service.refreshToken(mockSession.id);

      expect(sessionsService.update).toHaveBeenCalledWith(mockSession.id, {
        hash: expect.any(String) as unknown,
      });
      expect(result).toHaveProperty('token', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
      expect(result).toHaveProperty('tokenExpires');
    });
  });

  describe('logout', () => {
    it('should delete session and return true', async () => {
      sessionsService.deleteById.mockResolvedValue(undefined);

      const result = await service.logout('session-id');

      expect(sessionsService.deleteById).toHaveBeenCalledWith('session-id');
      expect(result).toBe(true);
    });
  });
});
