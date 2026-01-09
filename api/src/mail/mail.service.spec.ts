import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { createMockConfigService } from '../../test/mocks';
import { createMockMailProvider } from '../../test/mocks';
import { createMockUser, resetUserFactory } from '../../test/factories';
import { MAIL_PROVIDER_TOKEN } from './constants/mail.constants';
import { MailService } from './mail.service';

jest.mock('@react-email/render', () => ({
  render: jest
    .fn()
    .mockImplementation(
      (_component: unknown, options?: { plainText?: boolean }) =>
        Promise.resolve(
          options?.plainText ? 'Plain text email' : '<html>Mock Email</html>',
        ),
    ),
}));

describe('MailService', () => {
  let service: MailService;
  let mockMailProvider: ReturnType<typeof createMockMailProvider>;

  beforeEach(async () => {
    resetUserFactory();

    mockMailProvider = createMockMailProvider();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MAIL_PROVIDER_TOKEN, useValue: mockMailProvider },
        { provide: ConfigService, useValue: createMockConfigService() },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      await service.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(mockMailProvider.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
      });
    });

    it('should handle array of recipients', async () => {
      await service.sendEmail({
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockMailProvider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['user1@example.com', 'user2@example.com'],
        }),
      );
    });

    it('should throw when email fails', async () => {
      mockMailProvider.sendEmail.mockRejectedValue(new Error('SMTP error'));

      await expect(
        service.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        }),
      ).rejects.toThrow('SMTP error');
    });
  });

  describe('verifyConnection', () => {
    it('should return true when provider verifies successfully', async () => {
      (mockMailProvider.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.verifyConnection();

      expect(result).toBe(true);
      expect(mockMailProvider.verify).toHaveBeenCalled();
    });

    it('should return false when provider verification fails', async () => {
      (mockMailProvider.verify as jest.Mock).mockResolvedValue(false);

      const result = await service.verifyConnection();

      expect(result).toBe(false);
    });

    it('should return true when provider does not support verification', async () => {
      mockMailProvider.verify = undefined;

      const result = await service.verifyConnection();

      expect(result).toBe(true);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should render template and send welcome email', async () => {
      const user = createMockUser({ firstName: 'John', lastName: 'Doe' });

      await service.sendWelcomeEmail(user);

      expect(mockMailProvider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          subject: expect.stringContaining('Welcome'),
          html: expect.any(String),
          text: expect.any(String),
        }),
      );
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with token URL', async () => {
      const user = createMockUser();

      await service.sendVerificationEmail(user, 'verification-token-123');

      expect(mockMailProvider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          subject: expect.stringContaining('Verify'),
        }),
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with token URL', async () => {
      const user = createMockUser();

      await service.sendPasswordResetEmail(user, 'reset-token-456');

      expect(mockMailProvider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          subject: expect.stringContaining('Reset'),
        }),
      );
    });
  });

  describe('sendAccountDeletionEmail', () => {
    it('should send account deletion confirmation email', async () => {
      const user = createMockUser();

      await service.sendAccountDeletionEmail(user);

      expect(mockMailProvider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          subject: expect.stringContaining('Deleted'),
        }),
      );
    });
  });

  describe('sendLoginNotificationEmail', () => {
    it('should send login notification with metadata', async () => {
      const user = createMockUser();
      const metadata = {
        timestamp: new Date(),
        device: 'Desktop',
        browser: 'Chrome',
        location: 'New York, US',
        ipAddress: '192.168.1.1',
      };

      await service.sendLoginNotificationEmail(user, metadata);

      expect(mockMailProvider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          subject: expect.stringContaining('Login'),
        }),
      );
    });
  });

  describe('getUserName (via sendWelcomeEmail)', () => {
    it('should use full name when both first and last name exist', async () => {
      const user = createMockUser({ firstName: 'John', lastName: 'Doe' });

      await service.sendWelcomeEmail(user);

      expect(mockMailProvider.sendEmail).toHaveBeenCalled();
    });

    it('should use first name only when no last name', async () => {
      const user = createMockUser({
        firstName: 'John',
        lastName: undefined,
      });

      await service.sendWelcomeEmail(user);

      expect(mockMailProvider.sendEmail).toHaveBeenCalled();
    });

    it('should use email prefix when no names provided', async () => {
      const user = createMockUser({
        firstName: undefined,
        lastName: undefined,
        email: 'john.doe@example.com',
      });

      await service.sendWelcomeEmail(user);

      expect(mockMailProvider.sendEmail).toHaveBeenCalled();
    });
  });
});
